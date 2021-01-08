<?php

namespace App;

use App\Enums\ServerStatus;
use App\Traits\AddsModelNameTrait;
use BigBlueButton\BigBlueButton;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class Server extends Model
{
    use AddsModelNameTrait;

    const VIDEO_WEIGHT       = 3;
    const AUDIO_WEIGHT       = 2;
    const PARTICIPANT_WEIGHT = 1;

    protected $casts = [
        'strength'                  => 'integer',
        'status'                    => 'integer',
        'participant_count'         => 'integer',
        'listener_count'            => 'integer',
        'voice_participant_count'   => 'integer',
        'video_count'               => 'integer',
        'meeting_count'             => 'integer',
    ];

    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::updating(function (self $model) {
            /**
             * If status is changed and new status is not online, reset live usage data
             */
            if ($model->status != $model->getOriginal('status')) {
                if ($model->status != ServerStatus::ONLINE) {
                    $model->participant_count = null;
                    $model->listener_count = null;
                    $model->voice_participant_count = null;
                    $model->video_count = null;
                    $model->meeting_count = null;
                }
                if ($model->status == ServerStatus::OFFLINE) {
                    $model->endMeetings();
                }
            }
        });
    }

    /**
     * Find server with the lowest usage
     * @return Server|null
     */
    public static function lowestUsage()
    {
        return self::where('status', ServerStatus::ONLINE)
            // Experimental
            // Have video factor 3, audio factor 2 and just listening factor 1
            ->orderByRaw('((video_count*'.self::VIDEO_WEIGHT.' + voice_participant_count*'.self::AUDIO_WEIGHT.' + (participant_count-voice_participant_count) * '.self::PARTICIPANT_WEIGHT.')/strength) ASC')
            ->first();
    }

    /**
     * Return usage of a server, based on video, audio and participants
     * @return int
     */
    public function getUsageAttribute()
    {
        // Experimental
        // Have video factor 3, audio factor 2 and just listening factor 1
        return $this->video_count * self::VIDEO_WEIGHT + $this->voice_participant_count * self::AUDIO_WEIGHT + ($this->participant_count - $this->voice_participant_count) * self::PARTICIPANT_WEIGHT;
    }

    /**
     * Get bigbluebutton api instance with the url and secret stored in the database fields
     * @return BigBlueButton
     * @throws \Exception
     */
    public function bbb()
    {
        return new BigBlueButton($this->base_url, $this->salt);
    }

    /**
     * Get list of currently running meeting from the api
     * @return \BigBlueButton\Core\Meeting[]|null
     */
    public function getMeetings()
    {
        if ($this->status == ServerStatus::DISABLED) {
            return null;
        }

        try {
            $response = $this->bbb()->getMeetings();
            if ($response->failed()) {
                return null;
            }

            return $response->getMeetings();
        } catch (\Exception $exception) {
            // TODO add better error handling when provided by api
            return null;
        }
    }

    /**
     * Meetings that (have) run on this server
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function meetings()
    {
        return $this->hasMany(Meeting::class);
    }

    /**
     * Statistical data of this server
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function stats()
    {
        return $this->hasMany(ServerStat::class);
    }

    /**
     * Scope a query to only get servers that have a description like the passed one.
     *
     * @param  Builder $query       Query that should be scoped
     * @param  String  $description Description to search for
     * @return Builder The scoped query
     */
    public function scopeWithDescription(Builder $query, $description)
    {
        return $query->where('description', 'like', '%' . $description . '%');
    }

    /**
     * A call to the api failed, mark server as offline
     * @todo Could be used in the future to trigger alarms, notifications, etc.
     */
    public function apiCallFailed()
    {
        $this->status     = ServerStatus::OFFLINE;
        $this->timestamps = false;
        $this->save();
    }

    /**
     * Mark all meetings still marked as running on this server as ended
     * and cleanup live usage data for corresponding room
     */
    public function endMeetings()
    {
        foreach ($this->meetings()->whereNull('end')->get() as $meeting) {
            $meeting->end = date('Y-m-d H:i:s');
            $meeting->save();

            // If no other meeting is running for this room, reset live room usage
            if ($meeting->room->runningMeeting() == null) {
                $meeting->room->participant_count       = null;
                $meeting->room->listener_count          = null;
                $meeting->room->voice_participant_count = null;
                $meeting->room->video_count             = null;
                $meeting->room->save();
            }
        }
    }

    /**
     * Panic server, set status offline and try to end all meeting using the api
     */
    public function panic()
    {
        $this->status = ServerStatus::DISABLED;
        $this->save();

        $query   = $this->meetings()->whereNull('end');
        $total   = $query->count();
        $success = 0;
        foreach ($query->get() as $meeting) {
            try {
                $meeting->endMeeting();
                $success++;
            } catch (\Exception $exception) {
                $this->apiCallFailed();
                $this->status = ServerStatus::DISABLED;
                $this->save();

                return ['total'=>$total,'success'=>$total];
            }
        }

        return ['total'=>$total,'success'=>$success];
    }

    /**
     * Update live and historical usage data for this server and the meetings
     * also detect ghost meetings (marked as running in the db, but not running on the server) and end them
     */
    public function updateUsage()
    {
        // Get list with all meetings marked in the db as running and collect meetings
        // that are currently running on the server
        $allRunningMeetingsInDb      = $this->meetings()->whereNull('end')->pluck('id');
        $allRunningMeetingsOnServers = new Collection();

        if ($this->status != ServerStatus::DISABLED) {
            $bbbMeetings = $this->getMeetings();

            // Server is offline, end all meetings  in database
            if ($bbbMeetings === null) {
                $this->apiCallFailed();
                $serverStat = new ServerStat();
                $this->stats()->save($serverStat);
            } else {
                $serverStat                          = new ServerStat();
                $serverStat->participant_count       = 0;
                $serverStat->listener_count          = 0;
                $serverStat->voice_participant_count = 0;
                $serverStat->video_count             = 0;
                $serverStat->meeting_count           = 0;

                foreach ($bbbMeetings as $bbbMeeting) {

                    // Get usage for archival server statistics
                    if (!$bbbMeeting->isBreakout()) {
                        // exclude breakout room to prevent users to be counted twice:
                        // first in the main room, second on the breakout room
                        $serverStat->participant_count += $bbbMeeting->getParticipantCount();
                    }
                    $serverStat->listener_count += $bbbMeeting->getListenerCount();
                    $serverStat->voice_participant_count += $bbbMeeting->getVoiceParticipantCount();
                    $serverStat->video_count += $bbbMeeting->getVideoCount();
                    $serverStat->meeting_count++;

                    $allRunningMeetingsOnServers->add($bbbMeeting->getMeetingId());

                    $meeting = Meeting::find($bbbMeeting->getMeetingId());
                    if ($meeting === null) {
                        // Meeting was created via a different system, ignore
                        continue;
                    }

                    // Save current live room status and build archival data
                    $meetingStat                            = new MeetingStat();
                    $meeting->room->participant_count       = $meetingStat->participant_count       = $bbbMeeting->getParticipantCount();
                    $meeting->room->listener_count          = $meetingStat->listener_count          = $bbbMeeting->getListenerCount();
                    $meeting->room->voice_participant_count = $meetingStat->voice_participant_count = $bbbMeeting->getVoiceParticipantCount();
                    $meeting->room->video_count             = $meetingStat->video_count             = $bbbMeeting->getVideoCount();

                    if (setting('log_attendance')) {
                        $attendees = [];
                        foreach ($bbbMeeting->getAttendees() as $attendee) {
                            array_push($attendees, $attendee->getFullName());
                        }
                        $meetingStat->attendees = json_encode($attendees);
                    }

                    $meeting->stats()->save($meetingStat);
                    $meeting->room->save();
                }

                // Save current live server status
                $this->participant_count       = $serverStat->participant_count;
                $this->listener_count          = $serverStat->listener_count;
                $this->voice_participant_count = $serverStat->voice_participant_count;
                $this->video_count             = $serverStat->video_count;
                $this->meeting_count           = $serverStat->meeting_count;
                $this->status                  = ServerStatus::ONLINE;
                $this->timestamps              = false;
                $this->save();

                $this->stats()->save($serverStat);
            }
        }
        // find meetings that are marked as running in the database, but have not been found on the servers
        // fix the end date in the database to current timestamp
        $meetingsNotRunningOnServers = $allRunningMeetingsInDb->diff($allRunningMeetingsOnServers);
        foreach ($meetingsNotRunningOnServers as $meetingId) {
            $meeting = Meeting::find($meetingId);
            if ($meeting != null && $meeting->end == null) {
                $meeting->end = date('Y-m-d H:i:s');
                $meeting->save();
            }
        }
    }

    /**
     * Delete Server, only possible if no meetings from this system are running and the server is disabled
     * @return bool|null
     * @throws \Exception
     */
    public function delete()
    {
        if ($this->status != ServerStatus::DISABLED || $this->meetings()->whereNull('end')->count() != 0) {
            return false;
        }

        return parent::delete();
    }
}
