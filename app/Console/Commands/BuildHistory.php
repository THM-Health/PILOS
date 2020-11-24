<?php

namespace App\Console\Commands;

use App\Meeting;
use App\MeetingStat;
use App\ServerStat;
use App\Room;
use App\Server;
use Illuminate\Console\Command;

class BuildHistory extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'history:build';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check server status and capture usage data for live data and statistics';

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function handle()
    {
        // TODO End meetings marked in database as still running but not found on server api calls

        $servers = Server::all();

        foreach ($servers as $server) {
            if (!$server->status) {
                continue;
            }
            $bbbMeetings = $server->getMeetings();
            if ($bbbMeetings == null) {
                $server->participant_count       = null;
                $server->listener_count          = null;
                $server->voice_participant_count = null;
                $server->video_count             = null;
                $server->meeting_count           = null;
                $server->offline                 = true;
                $server->save();

                foreach ($server->meetings()->whereNull('end')->get() as $meeting) {
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

                continue;
            }

            $serverStat = new ServerStat();

            foreach ($bbbMeetings as $bbbMeeting) {

                // Get usage for archival server statistics
                $serverStat->participant_count += $bbbMeeting->getParticipantCount();
                $serverStat->listener_count += $bbbMeeting->getListenerCount();
                $serverStat->voice_participant_count += $bbbMeeting->getVoiceParticipantCount();
                $serverStat->video_count += $bbbMeeting->getVideoCount();
                $serverStat->meeting_count++;

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
            $server->participant_count       = $serverStat->participant_count;
            $server->listener_count          = $serverStat->listener_count;
            $server->voice_participant_count = $serverStat->voice_participant_count;
            $server->video_count             = $serverStat->video_count;
            $server->meeting_count           = $serverStat->meeting_count;
            $server->offline                 = false;
            $server->save();

            $server->stats()->save($serverStat);
        }
    }
}
