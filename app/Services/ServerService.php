<?php

namespace App\Services;

use App\Enums\ServerHealth;
use App\Enums\ServerStatus;
use App\Models\Meeting;
use App\Models\MeetingAttendee;
use App\Models\MeetingStat;
use App\Models\Server;
use App\Models\ServerStat;
use App\Models\User;
use App\Services\BigBlueButton\LaravelHTTPClient;
use BigBlueButton\BigBlueButton;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class ServerService
{
    protected BigBlueButton $bbb;

    public function getBigBlueButton(): BigBlueButton
    {
        return $this->bbb;
    }

    protected Server $server;

    public function __construct(Server $server)
    {
        $this->server = $server;
        $this->bbb = new BigBlueButton($server->base_url, $server->secret, new LaravelHTTPClient());
    }

    /**
     * Get list of currently running meeting from the api
     *
     * @return \BigBlueButton\Core\Meeting[]|null
     */
    public function getMeetings()
    {
        if ($this->server->status == ServerStatus::DISABLED) {
            return null;
        }

        try {
            $response = $this->bbb->getMeetings();

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
     * Get list of currently running meeting from the api
     */
    public function getBBBVersion(): ?string
    {
        if ($this->server->status == ServerStatus::DISABLED) {
            return null;
        }

        try {
            $response = $this->bbb->getApiVersion();
            if ($response->failed()) {
                return null;
            }

            $version = $response->getBbbVersion();

            return $version != '' ? $version : null;
        } catch (\Exception $exception) {
            return null;
        }
    }

    /**
     * A call to the api failed, mark server as offline
     *
     * @todo Could be used in the future to trigger alarms, notifications, etc.
     */
    public function handleApiCallFailed()
    {
        if ($this->server->health != ServerHealth::OFFLINE) {
            $this->server->error_count++;
            $this->server->recover_count = 0;
            $this->server->timestamps = false;
            $this->server->save();
        }

        if ($this->server->health == ServerHealth::OFFLINE) {
            $this->setMeetingsDetached();
        }
    }

    public function handleApiCallSuccessful()
    {
        if ($this->server->health != ServerHealth::ONLINE) {
            $this->server->recover_count++;
        }

        if ($this->server->health == ServerHealth::ONLINE) {
            $this->server->error_count = 0;
        }

        $this->server->timestamps = false;
        $this->server->save();

        $this->endDetachedMeetings();

        if ($this->server->status == ServerStatus::DRAINING) {
            // If no meeting is running switch from draining to disabled
            if ($this->server->meetings()->whereNull('end')->count() == 0) {
                $this->server->status = ServerStatus::DISABLED;
                $this->server->save();
            }
        }
    }

    /**
     * Mark all meetings still marked as running on this server as ended
     * and cleanup live usage data for corresponding room
     */
    public function endMeetings()
    {
        foreach ($this->server->meetings()->whereNull('end')->get() as $meeting) {
            (new MeetingService($meeting))->setEnd();

            // If no other meeting is running for this room, reset live room usage
            if (! $meeting->room->latestMeeting || $meeting->room->latestMeeting->end != null) {
                $meeting->room->participant_count = null;
                $meeting->room->listener_count = null;
                $meeting->room->voice_participant_count = null;
                $meeting->room->video_count = null;
                $meeting->room->save();
            }
        }
    }

    /**
     * Mark all meetings still marked as running on this server as detached
     * so a new meeting can be started on another server and this meeting can be ended
     * once the server is back online
     */
    private function setMeetingsDetached()
    {
        foreach ($this->server->meetings()->whereNull('end')->get() as $meeting) {
            $meeting->detached = now();
            $meeting->save();
        }
    }

    /**
     * Try to end all meetings marked as detached
     */
    private function endDetachedMeetings()
    {
        foreach ($this->server->meetings()->whereNotNull('detached')->whereNull('end')->get() as $meeting) {
            $meetingService = new MeetingService($meeting);
            try {
                $meetingService->end();
            } catch (\Exception $e) {
            }
        }
    }

    /**
     * Panic server, set status offline and try to end all meeting using the api
     */
    public function panic(): array
    {
        $this->server->status = ServerStatus::DISABLED;
        $this->server->save();

        $query = $this->server->meetings()->whereNull('end');
        $total = $query->count();
        $success = 0;
        foreach ($query->get() as $meeting) {
            try {
                (new MeetingService($meeting))->end();
                $success++;
            } catch (\Exception $exception) {
                //@TODO Check this
                $this->handleApiCallFailed();
                $this->server->status = ServerStatus::DISABLED;
                $this->server->save();

                return ['total' => $total, 'success' => $total];
            }
        }

        return ['total' => $total, 'success' => $success];
    }

    /**
     * Update live and historical usage data for this server and the meetings
     * also detect ghost meetings (marked as running in the db, but not running on the server) and end them
     */
    public function updateUsage()
    {
        // Server is disabled
        if ($this->server->status == ServerStatus::DISABLED) {
            return;
        }

        // Get list with all meetings marked in the db as running and collect meetings
        // that are currently running on the server
        $allRunningMeetingsInDb = $this->server->meetings()->whereNull('end')->whereNotNull('start')->pluck('id');
        $allRunningMeetingsOnServers = new Collection();

        $bbbMeetings = $this->getMeetings();

        // Server is offline
        if ($bbbMeetings === null) {
            $this->handleApiCallFailed();
            // Add server statistics if enabled
            if (setting('statistics.servers.enabled')) {
                $serverStat = new ServerStat();
                $this->server->stats()->save($serverStat);
            }

            if ($this->server->health == ServerHealth::OFFLINE) {
                // Clear current live server status
                $this->server->participant_count = null;
                $this->server->listener_count = null;
                $this->server->voice_participant_count = null;
                $this->server->video_count = null;
                $this->server->meeting_count = null;
                $this->server->version = null;
                $this->server->timestamps = false;
                $this->server->save();
            }

            return;
        }

        // Server is online
        $serverStat = new ServerStat();
        $serverStat->participant_count = 0;
        $serverStat->listener_count = 0;
        $serverStat->voice_participant_count = 0;
        $serverStat->video_count = 0;
        $serverStat->meeting_count = 0;

        foreach ($bbbMeetings as $bbbMeeting) {
            // Get usage for archival server statistics
            if (! $bbbMeeting->isBreakout()) {
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
            $meetingStat = new MeetingStat();
            $meeting->room->participant_count = $meetingStat->participant_count = $bbbMeeting->getParticipantCount();
            $meeting->room->listener_count = $meetingStat->listener_count = $bbbMeeting->getListenerCount();
            $meeting->room->voice_participant_count = $meetingStat->voice_participant_count = $bbbMeeting->getVoiceParticipantCount();
            $meeting->room->video_count = $meetingStat->video_count = $bbbMeeting->getVideoCount();

            // Record meeting attendance if enabled for this running meeting
            if ($meeting->record_attendance) {
                // Get collection of all attendees, remove duplicated (user joins twice)
                $collection = collect($bbbMeeting->getAttendees());
                $uniqueAttendees = $collection->unique(function ($attendee) {
                    return $attendee->getUserId();
                });

                // List of all created and found attendees
                $newAndExistingAttendees = [];
                foreach ($uniqueAttendees as $attendee) {
                    // Split user id in prefix and user_id (users) / session_id (guests)
                    $prefix = substr($attendee->getUserId(), 0, 1);
                    $id = substr($attendee->getUserId(), 1);

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
                                Log::notice('Attendee user not found.', ['user' => $id, 'meeting' => $meeting->id]);
                            }

                            break;
                        case 's': // users, identified by their session id
                            // check if user is marked in the database as still attending
                            $meetingAttendee = MeetingAttendee::where('meeting_id', $meeting->id)->where('session_id', $id)->whereNull('leave')->orderBy('join')->first();
                            // if no previous currently active attendance found in database, create new attendance
                            if ($meetingAttendee == null) {
                                $meetingAttendee = new MeetingAttendee();
                                $meetingAttendee->meeting()->associate($meeting);
                                $meetingAttendee->name = $attendee->getFullName();
                                $meetingAttendee->session_id = $id;
                                $meetingAttendee->join = now();
                                $meetingAttendee->save();
                            }
                            // add found or created record to list of new or existing attendances
                            array_push($newAndExistingAttendees, $meetingAttendee->id);

                            break;
                        default:
                            // some other not supported prefix was found
                            Log::notice('Unknown prefix for attendee found.', ['prefix' => $prefix, 'meeting' => $meeting->id]);

                            break;
                    }
                }

                // get all active attendees from database
                $allAttendees = MeetingAttendee::where('meeting_id', $meeting->id)->whereNull('leave')->get();
                // remove added or found attendees, to only have attendees left that are no longer active
                $leftAttendees = $allAttendees->filter(function ($attendee, $key) use ($newAndExistingAttendees) {
                    return ! in_array($attendee->id, $newAndExistingAttendees);
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

        $this->handleApiCallSuccessful();

        // Save current live server status
        $this->server->participant_count = $serverStat->participant_count;
        $this->server->listener_count = $serverStat->listener_count;
        $this->server->voice_participant_count = $serverStat->voice_participant_count;
        $this->server->video_count = $serverStat->video_count;
        $this->server->meeting_count = $serverStat->meeting_count;
        $this->server->timestamps = false;
        $this->server->version = $this->getBBBVersion();
        $this->server->save();

        // Save server statistics if enabled
        if (setting('statistics.servers.enabled')) {
            $this->server->stats()->save($serverStat);
        }

        // find meetings that are marked as running in the database, but have not been found on the servers
        // fix the end date in the database to current timestamp
        $meetingsNotRunningOnServers = $allRunningMeetingsInDb->diff($allRunningMeetingsOnServers);
        foreach ($meetingsNotRunningOnServers as $meetingId) {
            $meeting = Meeting::find($meetingId);
            if ($meeting != null && $meeting->end == null) {
                (new MeetingService($meeting))->setEnd();
            }
        }
    }
}
