<?php

namespace App\Services;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Http\Requests\StartJoinMeeting;
use App\Models\Meeting;
use App\Models\Room;
use Auth;
use BigBlueButton\Core\MeetingLayout;
use BigBlueButton\Parameters\CreateMeetingParameters;
use BigBlueButton\Parameters\EndMeetingParameters;
use BigBlueButton\Parameters\GetMeetingInfoParameters;
use BigBlueButton\Parameters\JoinMeetingParameters;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;
use Log;

class MeetingService
{
    private Meeting $meeting;
    private ServerService $serverService;

    /**
     * @param  ServerService  $serverService
     * @return MeetingService
     */
    public function setServerService(ServerService $serverService): self
    {
        $this->serverService = $serverService;

        return $this;
    }

    public function __construct(Meeting $meeting)
    {
        $this->meeting       = $meeting;
        $this->serverService = new ServerService($meeting->server);
    }

    /**
     * Callback-salt for meeting and server
     */
    protected function getCallbackSalt(): string
    {
        return $this->meeting->id . $this->meeting->server->salt;
    }

    public function validateCallbackSalt(string $salt): bool
    {
        return Hash::check($this->getCallbackSalt(), $salt);
    }

    public function getCallbackUrl(): string
    {
        return url()->route('api.v1.meetings.endcallback', ['meeting'=>$this->meeting,'salt'=> Hash::make($this->getCallbackSalt())]);
    }

    /**
     * Start meeting with the properties saved for this meeting and room
     */
    public function start(): ?\BigBlueButton\Responses\CreateMeetingResponse
    {
        // Set meeting parameters
        // TODO user limit, not working properly with bbb at the moment
        $meetingParams = new CreateMeetingParameters($this->meeting->id, $this->meeting->room->name);
        $meetingParams->setModeratorPW($this->meeting->moderator_pw)
            ->setAttendeePW($this->meeting->attendee_pw)
            ->setRecord($this->meeting->record)
            ->setLogoutURL(url('rooms/'.$this->meeting->room->id))
            ->setEndCallbackUrl($this->getCallbackUrl())
            ->setDuration($this->meeting->room->duration)
            ->setWelcome($this->meeting->room->welcome)
            ->setModeratorOnlyMessage($this->meeting->room->getModeratorOnlyMessage())
            ->setLockSettingsDisableMic($this->meeting->room->lock_settings_disable_mic)
            ->setLockSettingsDisableCam($this->meeting->room->lock_settings_disable_cam)
            ->setWebcamsOnlyForModerator($this->meeting->room->webcams_only_for_moderator)
            ->setLockSettingsDisablePrivateChat($this->meeting->room->lock_settings_disable_private_chat)
            ->setLockSettingsDisablePublicChat($this->meeting->room->lock_settings_disable_public_chat)
            ->setLockSettingsDisableNote($this->meeting->room->lock_settings_disable_note)
            ->setLockSettingsHideUserList($this->meeting->room->lock_settings_hide_user_list)
            ->setLockSettingsLockOnJoin($this->meeting->room->lock_settings_lock_on_join)
            ->setMuteOnStart($this->meeting->room->mute_on_start)
            ->setMeetingLayout(MeetingLayout::CUSTOM_LAYOUT)
            ->setLearningDashboardEnabled(false)
            ->setRemindRecordingIsOn(true)
            ->setNotifyRecordingIsOn(true);

        // TODO: implement remindRecordingIsOn / notifyRecordingIsOn in littleredbutton api

        $meetingParams->addMeta('bbb-origin', 'PILOS');

        // get files that should be used in this meeting and add links to the files
        $files = $this->meeting->room->files()->where('use_in_meeting', true)->orderBy('default', 'desc')->get();
        foreach ($files as $file) {
            $meetingParams->addPresentation((new RoomFileService($file))->url(), null, preg_replace("/[^A-Za-z0-9.-_\(\)]/", '', $file->filename));
        }

        if (empty($meetingParams->getPresentations()) && !empty(setting('default_presentation'))) {
            $meetingParams->addPresentation(setting('default_presentation'));
        }

        // set guest policy
        if ($this->meeting->room->lobby == RoomLobby::ENABLED) {
            $meetingParams->setGuestPolicyAskModerator();
        }
        if ($this->meeting->room->lobby == RoomLobby::ONLY_GUEST) {
            $meetingParams->setGuestPolicyAlwaysAcceptAuth();
        }

        // if a logo is defined, set logo
        if (setting()->has('bbb_logo')) {
            $meetingParams->setLogo(setting('bbb_logo'));
        }

        // Try to start meeting
        try {
            $result = $this->serverService->getBigBlueButton()->createMeeting($meetingParams);
        } // Catch exceptions, e.g. network connection issues
        catch (\Exception $exception) {
            // Remove meeting and set server to offline
            $this->meeting->forceDelete();
            $this->serverService->handleApiCallFailed();

            return null;
        }

        // Check server response for meeting creation
        if (!$result->success()) {
            // Meeting creation failed, remove meeting
            $this->meeting->forceDelete();
            // Check for some errors
            switch ($result->getMessageKey()) {
                // checksum error, api token invalid, set server to offline, try to create on other server
                case 'checksumError':
                    $this->serverService->handleApiCallFailed();

                    break;
                    // for other unknown reasons, just respond, that room creation failed
                    // the error is probably server independent
                default:
                    break;
            }

            return null;
        }

        return $result;
    }

    /**
     * Is Meeting running
     */
    public function isRunning(): bool
    {
        $isMeetingRunningParams = new GetMeetingInfoParameters($this->meeting->id);
        // TODO Replace with meetingIsRunning after bbb updates its api, see https://github.com/bigbluebutton/bigbluebutton/issues/8246
        try {
            $response = $this->serverService->getBigBlueButton()->getMeetingInfo($isMeetingRunningParams);
        } // Catch exceptions, e.g. network connection issues
        catch (\Exception $exception) {
            Log::warning('Checking if room {room} is running on server {server} failed', ['room' => $this->meeting->room->getLogLabel(), 'server' => $this->meeting->server->getLogLabel() ]);

            // Remove meeting and set server to offline
            $this->meeting->forceDelete();
            $this->serverService->handleApiCallFailed();

            return false;
        }

        return $response->success();
    }

    /**
     * End meeting
     * @throws \Exception e.g. Connection error
     */
    public function end(): void
    {
        $endParams = new EndMeetingParameters($this->meeting->id, $this->meeting->moderator_pw);
        $this->serverService->getBigBlueButton()->endMeeting($endParams)->success();
        $this->setEnd();
    }

    /**
     * Set end time of the meeting and
     * set end time of attendance
     */
    public function setEnd(): void
    {
        $this->meeting->end = now();
        $this->meeting->save();

        // set end time of the attendance to the end time of the meeting
        // for all users that have been present to the end
        foreach ($this->meeting->attendees()->whereNull('leave')->get() as $attendee) {
            $attendee->leave = now();
            $attendee->save();
        }
    }

    /**
     * Collection of the attendance of users and guests
     * Multiple sessions of the same user/guest are grouped and the length of each session summed
     */
    public function attendance(): Collection|\Illuminate\Support\Collection
    {
        // Load guest and user attendances, group by session or user_id
        $guests = $this->meeting->attendees()->whereNotNull('session_id')->get()->groupBy('session_id');
        $users  = $this->meeting->attendees()->whereNotNull('user_id')->get()->groupBy('user_id');

        // create array of guest attendees
        $guests       = $guests->map(function ($guest) {
            $sessions = $this->mapAttendanceSessions($guest);

            return ['name' => $guest[0]->name, 'email' => null, 'duration' => $sessions->sum('duration'), 'sessions' => $sessions];
        });

        // create array of user attendees
        $users        = $users->map(function ($user) {
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
     */
    private function mapAttendanceSessions($sessions): mixed
    {
        return $sessions->map(function ($session) {
            return ['id'=> $session->id, 'join' => $session->join, 'leave' => $session->leave, 'duration' => $session->join->diffInMinutes($session->leave)];
        });
    }

    /**
     * @param  mixed            $token
     * @param  StartJoinMeeting $request
     * @param  Room             $room
     * @return string
     */
    public function getJoinUrl(StartJoinMeeting $request): string
    {
        $token = $request->token;

        if ($token) {
            $name = $token->fullname;
        } else {
            $name = Auth::guest() ? $request->name : Auth::user()->fullname;
        }
        $userId = Auth::guest() ? 's' . session()->getId() : 'u' . Auth::user()->id;
        $role   = $this->meeting->room->getRole(Auth::user(), $token);

        $password = ($role->is(RoomUserRole::MODERATOR()) || $role->is(RoomUserRole::CO_OWNER()) || $role->is(RoomUserRole::OWNER)) ? $this->meeting->moderator_pw : $this->meeting->attendee_pw;

        $joinMeetingParams = new JoinMeetingParameters($this->meeting->id, $name, $password);
        $joinMeetingParams->setRedirect(true);
        $joinMeetingParams->setUserID($userId);
        $joinMeetingParams->setAvatarURL(Auth::user() ? Auth::user()->imageUrl : null);
        if ($role->is(RoomUserRole::GUEST())) {
            $joinMeetingParams->setGuest(true);
        }
        $joinMeetingParams->addUserData('bbb_skip_check_audio', Auth::user() ? Auth::user()->bbb_skip_check_audio : false);

        $joinMeetingParams->addUserData('bbb_record_video', $request->record_video);

        // If a custom style file is set, pass url to bbb html5 client
        if (setting()->has('bbb_style')) {
            $joinMeetingParams->addUserData('bbb_custom_style_url', setting('bbb_style'));
        }

        return $this->serverService->getBigBlueButton()->getJoinMeetingURL($joinMeetingParams);
    }
}
