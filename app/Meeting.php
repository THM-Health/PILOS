<?php

namespace App;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use BigBlueButton\Parameters\CreateMeetingParameters;
use BigBlueButton\Parameters\EndMeetingParameters;
use BigBlueButton\Parameters\GetMeetingInfoParameters;
use BigBlueButton\Parameters\JoinMeetingParameters;
use GoldSpecDigital\LaravelEloquentUUID\Database\Eloquent\Uuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\URL;

class Meeting extends Model
{
    use Uuid;

    /**
     * The "type" of the auto-incrementing ID.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $guarded = [];

    protected $casts = [
        'start'              => 'datetime',
        'end'                => 'datetime',
        'record_attendance'  => 'boolean'
    ];

    /**
     * Server the meeting is/should be running on
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function server()
    {
        return $this->belongsTo(Server::class);
    }

    /**
     * Room this meeting belongs to
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Callback-salt for his meeting and server, required to validate incoming end of meeting request
     * @param $hash boolean Hash the callback salt
     * @return string
     */
    public function getCallbackSalt($hash = false)
    {
        if ($hash) {
            return Hash::make( $this->id.$this->server->salt);
        }

        return $this->id.$this->server->salt;
    }

    /**
     * Start this meeting with the properties saved for this meeting and room
     * @return boolean Meeting was successfully started
     */
    public function startMeeting()
    {
        // Set meeting parameters
        // TODO user limit, not working properly with bbb at the moment
        $meetingParams = new CreateMeetingParameters($this->id, $this->room->name);
        $meetingParams->setModeratorPassword($this->moderatorPW)
            ->setAttendeePassword($this->attendeePW)
            ->setLogoutUrl(url('rooms/'.$this->room->id))
            ->setEndCallbackUrl(url()->route('api.v1.meetings.endcallback', ['meeting'=>$this,'salt'=>$this->getCallbackSalt(true)]))
            ->setDuration($this->room->duration)
            ->setWelcomeMessage($this->room->welcome)
            ->setModeratorOnlyMessage($this->room->getModeratorOnlyMessage())
            ->setLockSettingsDisableMic($this->room->lockSettingsDisableMic)
            ->setLockSettingsDisableCam($this->room->lockSettingsDisableCam)
            ->setWebcamsOnlyForModerator($this->room->webcamsOnlyForModerator)
            ->setLockSettingsDisablePrivateChat($this->room->lockSettingsDisablePrivateChat)
            ->setLockSettingsDisablePublicChat($this->room->lockSettingsDisablePublicChat)
            ->setLockSettingsDisableNote($this->room->lockSettingsDisableNote)
            ->setLockSettingsHideUserList($this->room->lockSettingsHideUserList)
            ->setLockSettingsLockOnJoin($this->room->lockSettingsLockOnJoin)
            ->setMuteOnStart($this->room->muteOnStart);

        // get files that should be used in this meeting and add links to the files
        $files = $this->room->files()->where('useinmeeting', true)->orderBy('default', 'desc')->get();
        foreach ($files as $file) {
            $meetingParams->addPresentation($file->getDownloadLink(), null, preg_replace("/[^A-Za-z0-9.-_\(\)]/", '', $file->filename));
        }

        if (empty($meetingParams->getPresentations()) && !empty(setting('default_presentation'))) {
            $meetingParams->addPresentation(setting('default_presentation'));
        }

        // set guest policy
        if ($this->room->lobby == RoomLobby::ENABLED) {
            $meetingParams->setGuestPolicyAskModerator();
        }
        if ($this->room->lobby == RoomLobby::ONLY_GUEST) {
            $meetingParams->setGuestPolicyAlwaysAcceptAuth();
        }

        return $this->server->bbb()->createMeeting($meetingParams);
    }

    /**
     * Is Meeting running
     * @return bool
     */
    public function isRunning()
    {
        // TODO Remove blank password, after PHP BBB library is updated
        $isMeetingRunningParams = new GetMeetingInfoParameters($this->id, null);
        // TODO Replace with meetingIsRunning after bbb updates its api, see https://github.com/bigbluebutton/bigbluebutton/issues/8246
        $response               = $this->server->bbb()->getMeetingInfo($isMeetingRunningParams);

        return $response->success();
    }

    /**
     * End meeting
     * @throws \Exception e.g. Connection error
     */
    public function endMeeting()
    {
        $endParams = new EndMeetingParameters($this->id, $this->moderatorPW);
        $this->server->bbb()->endMeeting($endParams)->success();
        $this->setEnd();
    }

    /**
     * Set end time of the meeting and
     * set end time of attendance
     */
    public function setEnd()
    {
        $this->end = now();
        $this->save();

        // set end time of the attendance to the end time of the meeting
        // for all users that have been present to the end
        foreach ($this->attendees()->whereNull('leave')->get() as $attendee) {
            $attendee->leave = now();
            $attendee->save();
        }
    }

    /**
     * Create a join url for this meeting
     * @param $name string Name of the user
     * @param $role RoomUserRole Role of the user inside the meeting
     * @param $userid integer unique identifier for this user/guest
     * @param $skipAudioCheck boolean Flag, whether to skip the audio check or not
     * @return mixed
     */
    public function getJoinUrl($name, $role, $userid, $skipAudioCheck)
    {
        $password = ($role == RoomUserRole::MODERATOR || $role == RoomUserRole::CO_OWNER || $role == RoomUserRole::OWNER ) ? $this->moderatorPW : $this->attendeePW;

        $joinMeetingParams = new JoinMeetingParameters($this->id, $name, $password);
        $joinMeetingParams->setJoinViaHtml5(true);
        $joinMeetingParams->setRedirect(true);
        $joinMeetingParams->setUserId($userid);
        $joinMeetingParams->setGuest($role == RoomUserRole::GUEST);
        $joinMeetingParams->addUserData('bbb_skip_check_audio', $skipAudioCheck);

        return $this->server->bbb()->getJoinMeetingURL($joinMeetingParams);
    }

    /**
     * Statistical data of this meeting
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function stats()
    {
        return $this->hasMany(MeetingStat::class);
    }

    /**
     * Attendees of this meeting
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function attendees()
    {
        return $this->hasMany(MeetingAttendee::class);
    }

    /**
     * Collection of the attendance of users and guests
     * Multiple sessions of the same user/guest are grouped and the length of each session summed
     * @return \Illuminate\Database\Eloquent\Collection|\Illuminate\Support\Collection
     */
    public function attendance()
    {
        // Load guest and user attendances, group by session or user_id
        $guests = $this->attendees()->whereNotNull('session_id')->get()->groupBy('session_id');
        $users  = $this->attendees()->whereNotNull('user_id')->get()->groupBy('user_id');

        // create array of guest attendees
        $guests = $guests->map(function ($guest, $key) {
            $sessions = $this->mapAttendanceSessions($guest);

            return ['name' => $guest[0]->name, 'email' => null, 'duration' => $sessions->sum('duration'), 'sessions' => $sessions];
        });

        // create array of user attendees
        $users = $users->map(function ($user, $key) {
            $sessions = $this->mapAttendanceSessions($user);

            return ['name' => $user[0]->user->firstname.' '.$user[0]->user->lastname, 'email' => $user[0]->user->email, 'duration' => $sessions->sum('duration'), 'sessions' => $sessions];
        });

        // if no guests present, just return list of users, sorted by name
        if ($guests->count() == 0) {
            return $users->sortBy('name')->values();
        }

        // return guest and user attendees, sorted by name
        return $guests->merge($users)->sortBy('name')->values();
    }

    /**
     * Helper function for attendance(), map each attendance database entry to an attendance session array
     * @param $sessions
     * @return mixed
     */
    private function mapAttendanceSessions($sessions)
    {
        return $sessions->map(function ($session, $key) {
            return ['id'=> $session->id, 'join' => $session->join, 'leave' => $session->leave, 'duration' => $session->join->diffInMinutes($session->leave)];
        });
    }
}
