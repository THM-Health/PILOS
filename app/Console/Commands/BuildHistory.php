<?php

namespace App\Console\Commands;

use App\Meeting;
use App\MeetingStat;
use App\Room;
use App\Server;
use App\User;
use DateTime;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use LdapRecord\Models\OpenLDAP\User as OpenLDAPUser;

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
    protected $description = 'Command description';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $servers = Server::all();

        $openMeetings = Meeting::whereNull('end')->pluck('id')->all();
        $runningMeetings = [];

        foreach ($servers as $server){
            if($server->status==0)
                continue;
            $meetings = $server->getMeetings();
            if($meetings == null)
                continue;
            $runningMeetings = array_merge($runningMeetings,$meetings->pluck('internalMeetingID')->all());
            $this->syncMeetings($meetings,$server,false);
            $this->syncMeetings($meetings,$server,true);
        }

        $endedMeetings = array_diff($openMeetings, $runningMeetings);
        foreach ($endedMeetings as $endedMeeting){
            $meeting = Meeting::find($endedMeeting);
            $meeting->end = Carbon::now('UTC')->toDateTimeString();
            $meeting->save();
        }
    }

    private function syncMeetings($meetings,$server,$breakOut = false){


        foreach($meetings as $bbbMeeting) {
            if(($bbbMeeting['isBreakout']=="true") !== $breakOut)
                continue;

            $room = Room::firstOrCreate(['id' => $bbbMeeting['meetingID']],['name'=>$bbbMeeting['meetingName'],'attendeePW'=>$bbbMeeting['attendeePW'],'moderatorPW'=>$bbbMeeting['moderatorPW']])->fresh();

            if(!$room->owner()->exists() && isset($bbbMeeting['metadata']['owner-email'])){
                // Search for user with the username in database
                $user = User::firstOrCreate(['email'=>$bbbMeeting['metadata']['owner-email']],['name'=>$bbbMeeting['metadata']['owner-name'],'password'=>Hash::make(random_bytes(16))]);

                // If user isn't ldap, search for user in ldap and import
               if($user->guid==null) {
                    $ldapUser = OpenLDAPUser::findBy('mail', $user->email);
                    // User found in ldap, update attributes
                    if ($ldapUser != null) {
                        $user->username = $ldapUser->uid[0];
                        $user->guid = $ldapUser->entryuuid[0];
                        $user->domain = "default";
                        $user->save();
                    }
                }

                $room->owner()->associate($user);
                $room->save();
            }

            $meeting = Meeting::firstOrCreate(['id' => $bbbMeeting['internalMeetingID']],['room_id'=>$room->id,'start'=>Carbon::createFromTimestampUTC(floor($bbbMeeting['startTime']/1000))->toDateTimeString(),'server_id'=>$server->id,'isBreakout'=>$bbbMeeting['isBreakout']=="true",'parentMeetingID'=>$bbbMeeting['isBreakout']=="true"?$bbbMeeting['parentMeetingID']:null]);

            $latestMeetingStat = $meeting->stats()->latest()->first();

            if($latestMeetingStat!=null && strtotime($latestMeetingStat->created_at) > Carbon::now()->subMinutes(5)->timestamp)
                continue;
            $stat = new MeetingStat();
            $stat->participantCount = $bbbMeeting['participantCount'];
            $stat->listenerCount = $bbbMeeting['listenerCount'];
            $stat->voiceParticipantCount = $bbbMeeting['voiceParticipantCount'];
            $stat->videoCount = $bbbMeeting['videoCount'];
            $stat->meeting()->associate($meeting);
            $stat->save();
        }
    }
}
