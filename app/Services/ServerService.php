<?php

namespace App\Services;

use App\Enums\ServerHealth;
use App\Enums\ServerStatus;
use App\Models\Meeting;
use App\Models\MeetingStat;
use App\Models\Server;
use App\Models\ServerStat;
use App\Plugins\Contracts\ServerLoadCalculationPluginContract;
use App\Services\BigBlueButton\LaravelHTTPClient;
use BigBlueButton\BigBlueButton;
use Illuminate\Support\Collection;
use Log;

class ServerService
{
    protected BigBlueButton $bbb;

    public function getBigBlueButton(): BigBlueButton
    {
        return $this->bbb;
    }

    protected Server $server;

    protected ServerLoadCalculationPluginContract $loadCalculationPlugin;

    public function __construct(Server $server)
    {
        $this->server = $server;
        $this->bbb = new BigBlueButton($server->base_url, $server->secret, new LaravelHTTPClient);
        $this->loadCalculationPlugin = app(ServerLoadCalculationPluginContract::class);
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
    private function getBBBVersion(): ?string
    {
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
        }

        $this->server->load = null;
        $this->server->recover_count = 0;
        $this->server->timestamps = false;
        $this->server->save();

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
     * Mark all meetings still marked as running on this server as detached
     * so a new meeting can be started on another server and this meeting can be ended
     * once the server is back online
     */
    private function setMeetingsDetached()
    {
        foreach ($this->server->meetings()->whereNull('end')->whereNull('detached')->get() as $meeting) {
            $meeting->detached = now();
            $meeting->save();
            Log::warning('Meeting {meeting} for room {room} detached', ['room' => $meeting->room->getLogLabel(), 'meeting' => $meeting->getLogLabel()]);
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
                Log::notice('Ended detached meeting {meeting} for room {room}', ['room' => $meeting->room->getLogLabel(), 'meeting' => $meeting->getLogLabel()]);
            } catch (\Exception $e) {
                Log::error('Failed to end detached meeting {meeting} for room {room}', ['room' => $meeting->room->getLogLabel(), 'meeting' => $meeting->getLogLabel()]);
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
                // Connection error, but try to continue
                // as the server should be marked as offline
            }
        }

        return ['total' => $total, 'success' => $success];
    }

    /**
     * Update live and historical usage data for this server and the meetings
     * also detect ghost meetings (marked as running in the db, but not running on the server) and end them
     */
    public function updateUsage($updateServerStatistics = false, $updateMeetingStatistics = false, $updateAttendance = false): void
    {
        // Server is disabled
        if ($this->server->status == ServerStatus::DISABLED) {
            return;
        }

        // Get list with all meetings marked in the db as running and collect meetings
        // that are currently running on the server
        $allRunningMeetingsInDb = $this->server->meetings()->whereNull('end')->whereNotNull('start')->get();
        $allRunningMeetingsOnServers = new Collection;

        $bbbMeetings = $this->getMeetings();

        // Server is offline
        if ($bbbMeetings === null) {
            $this->handleApiCallFailed();
            // Add server statistics if enabled
            if ($updateServerStatistics) {
                $serverStat = new ServerStat;
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

                // Clear current live room status
                foreach ($allRunningMeetingsInDb as $meeting) {
                    // Double check if the meeting is the latest meeting in the room
                    if (! $meeting->is($meeting->room->latestMeeting)) {
                        continue;
                    }

                    $meeting->room->participant_count = null;
                    $meeting->room->listener_count = null;
                    $meeting->room->voice_participant_count = null;
                    $meeting->room->video_count = null;
                    $meeting->room->save();
                }
            }

            return;
        }

        // Server is online
        $serverStat = new ServerStat;
        $serverStat->participant_count = 0;
        $serverStat->listener_count = 0;
        $serverStat->voice_participant_count = 0;
        $serverStat->video_count = 0;
        $serverStat->meeting_count = 0;

        $load = 0;

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
            $meetingStat = new MeetingStat;
            $meeting->room->participant_count = $meetingStat->participant_count = $bbbMeeting->getParticipantCount();
            $meeting->room->listener_count = $meetingStat->listener_count = $bbbMeeting->getListenerCount();
            $meeting->room->voice_participant_count = $meetingStat->voice_participant_count = $bbbMeeting->getVoiceParticipantCount();
            $meeting->room->video_count = $meetingStat->video_count = $bbbMeeting->getVideoCount();

            // Update meeting attendance if enabled for this running meeting
            if ($meeting->record_attendance && $updateAttendance) {
                (new MeetingService($meeting))->updateAttendance($bbbMeeting);
            }

            // Save meeting statistics if enabled
            if ($updateMeetingStatistics) {
                $meeting->stats()->save($meetingStat);
            }

            $meeting->room->save();
        }

        $load = $this->loadCalculationPlugin->getLoad($bbbMeetings);

        // Save current live server status
        $this->server->participant_count = $serverStat->participant_count;
        $this->server->listener_count = $serverStat->listener_count;
        $this->server->voice_participant_count = $serverStat->voice_participant_count;
        $this->server->video_count = $serverStat->video_count;
        $this->server->meeting_count = $serverStat->meeting_count;
        $this->server->timestamps = false;
        $this->server->version = $this->getBBBVersion();
        $this->server->load = $load;
        $this->server->save();

        // Save server statistics if enabled
        if ($updateServerStatistics) {
            $this->server->stats()->save($serverStat);
        }

        // find meetings that are marked as running in the database, but have not been found on the servers
        // fix the end date in the database to current timestamp
        $meetingsNotRunningOnServers = $allRunningMeetingsInDb->pluck('id')->diff($allRunningMeetingsOnServers);
        foreach ($meetingsNotRunningOnServers as $meetingId) {
            $meeting = Meeting::find($meetingId);
            if ($meeting != null && $meeting->end == null) {
                Log::warning('Meeting {meeting} for room {room} is not running on the BBB server', ['room' => $meeting->room->getLogLabel(), 'meeting' => $meeting->getLogLabel()]);

                (new MeetingService($meeting))->setEnd();
            }
        }

        $this->handleApiCallSuccessful();
    }
}
