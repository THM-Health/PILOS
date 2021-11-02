<?php

namespace App;

use App\Enums\ServerStatus;
use App\Traits\AddsModelNameTrait;
use BigBlueButton\BigBlueButton;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class Server extends Model
{
    use AddsModelNameTrait, HasFactory;

    protected $bbb;

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
        static::deleting(function (self $model) {
            // Delete Server, only possible if no meetings from this system are running and the server is disabled
            if ($model->status != ServerStatus::DISABLED || $model->meetings()->whereNull('end')->count() != 0) {
                return false;
            }
        });
    }

    /**
     * Get bigbluebutton api instance
     * If not set before with setBBB initialise with the url and secret stored in the database fields
     * @return BigBlueButton
     * @throws \Exception
     */
    public function bbb()
    {
        if ($this->bbb == null) {
            $this->setBBB(new BigBlueButton($this->base_url, $this->salt));
        }

        return $this->bbb;
    }

    /**
     * Set bigbluebutton api instance
     * @param BigBlueButton $bbb
     */
    public function setBBB(BigBlueButton $bbb)
    {
        $this->bbb = $bbb;
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
     * @return HasMany
     */
    public function meetings()
    {
        return $this->hasMany(Meeting::class);
    }

    /**
     * Server pools the server is part of
     * @return BelongsToMany
     */
    public function pools(): BelongsToMany
    {
        return $this->belongsToMany(ServerPool::class);
    }

    /**
     * Statistical data of this server
     * @return HasMany
     */
    public function stats()
    {
        return $this->hasMany(ServerStat::class);
    }

    /**
     * Scope a query to only get servers that have a name like the passed one.
     *
     * @param  Builder $query Query that should be scoped
     * @param  String  $name  Name to search for
     * @return Builder The scoped query
     */
    public function scopeWithName(Builder $query, $name)
    {
        return $query->where('name', 'like', '%' . $name . '%');
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
            $meeting->setEnd();

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
        $allRunningMeetingsInDb      = $this->meetings()->whereNull('end')->whereNotNull('start')->pluck('id');
        $allRunningMeetingsOnServers = new Collection();

        if ($this->status != ServerStatus::DISABLED) {
            $bbbMeetings = $this->getMeetings();

            // Server is offline, end all meetings  in database
            if ($bbbMeetings === null) {
                $this->apiCallFailed();
                // Add server statistics if enabled
                if (setting('statistics.servers.enabled')) {
                    $serverStat = new ServerStat();
                    $this->stats()->save($serverStat);
                }
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

                    // Record meeting attendance if enabled globally and for this running meeting
                    if ($meeting->record_attendance && setting('attendance.enabled')) {
                        // Get collection of all attendees, remove duplicated (user joins twice)
                        $collection      = collect($bbbMeeting->getAttendees());
                        $uniqueAttendees = $collection->unique(function ($attendee) {
                            return $attendee->getUserId();
                        });

                        // List of all created and found attendees
                        $newAndExistingAttendees = [];
                        foreach ($uniqueAttendees as $attendee) {
                            // Split user id in prefix and user_id (users) / session_id (guests)
                            $prefix = substr($attendee->getUserId(), 0, 1);
                            $id     = substr($attendee->getUserId(), 1);

                            switch ($prefix) {
                                case 'u': // users, identified by their id
                                    // try to find user in database
                                    $user = User::find($id);
                                    // user was found
                                    if ($user != null) {
                                        // check if user is marked in the database as still attending
                                        $meetingAttendee = MeetingAttendee::where('meeting_id', $meeting->id)->where('user_id', $id)->whereNull('leave')->orderBy('join')->first();
                                        // if no previous currently active attendance found in database, create new attendance
                                        if ($meetingAttendee == null) {
                                            $meetingAttendee = new MeetingAttendee();
                                            $meetingAttendee->meeting()->associate($meeting);
                                            $meetingAttendee->user()->associate($user);
                                            $meetingAttendee->join = now();
                                            $meetingAttendee->save();
                                        }
                                        // add found or created record to list of new or existing attendances
                                        array_push($newAndExistingAttendees, $meetingAttendee->id);
                                    } else {
                                        // user was not found in database
                                        Log::notice('Attendee user not found.', ['user' => $id,'meeting'=> $meeting->id]);
                                    }

                                    break;
                                case 's': // users, identified by their session id
                                    // check if user is marked in the database as still attending
                                    $meetingAttendee = MeetingAttendee::where('meeting_id', $meeting->id)->where('session_id', $id)->whereNull('leave')->orderBy('join')->first();
                                    // if no previous currently active attendance found in database, create new attendance
                                    if ($meetingAttendee == null) {
                                        $meetingAttendee = new MeetingAttendee();
                                        $meetingAttendee->meeting()->associate($meeting);
                                        $meetingAttendee->name       = $attendee->getFullName();
                                        $meetingAttendee->session_id = $id;
                                        $meetingAttendee->join       = now();
                                        $meetingAttendee->save();
                                    }
                                    // add found or created record to list of new or existing attendances
                                    array_push($newAndExistingAttendees, $meetingAttendee->id);

                                    break;
                                default:
                                    // some other not supported prefix was found
                                    Log::notice('Unknown prefix for attendee found.', ['prefix' => $prefix,'meeting'=> $meeting->id]);

                                    break;
                            }
                        }

                        // get all active attendees from database
                        $allAttendees = MeetingAttendee::where('meeting_id', $meeting->id)->whereNull('leave')->get();
                        // remove added or found attendees, to only have attendees left that are no longer active
                        $leftAttendees = $allAttendees->filter(function ($attendee, $key) use ($newAndExistingAttendees) {
                            return !in_array($attendee->id, $newAndExistingAttendees);
                        });
                        // set end time of left attendees to current datetime
                        foreach ($leftAttendees as $leftAttendee) {
                            $leftAttendee->leave = now();
                            $leftAttendee->save();
                        }
                    }

                    // Save meeting statistics if enabled
                    if (setting('statistics.meetings.enabled')) {
                        $meeting->stats()->save($meetingStat);
                    }

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

                // Save server statistics if enabled
                if (setting('statistics.servers.enabled')) {
                    $this->stats()->save($serverStat);
                }
            }
        }
        // find meetings that are marked as running in the database, but have not been found on the servers
        // fix the end date in the database to current timestamp
        $meetingsNotRunningOnServers = $allRunningMeetingsInDb->diff($allRunningMeetingsOnServers);
        foreach ($meetingsNotRunningOnServers as $meetingId) {
            $meeting = Meeting::find($meetingId);
            if ($meeting != null && $meeting->end == null) {
                $meeting->setEnd();
            }
        }
    }
}
