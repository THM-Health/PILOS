<?php

namespace App\Services;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Http\Requests\StartJoinMeeting;
use App\Models\Meeting;
use App\Models\MeetingAttendee;
use App\Models\Room;
use App\Models\User;
use Auth;
use BigBlueButton\Core\MeetingLayout;
use BigBlueButton\Enum\Feature;
use BigBlueButton\Enum\Role;
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

    public function setServerService(ServerService $serverService): self
    {
        $this->serverService = $serverService;

        return $this;
    }

    public function __construct(Meeting $meeting)
    {
        $this->meeting = $meeting;
        $this->serverService = new ServerService($meeting->server);
    }

    /**
     * Callback-salt for meeting and server
     */
    protected function getCallbackSalt(): string
    {
        return $this->meeting->id.$this->meeting->server->secret;
    }

    public function validateCallbackSalt(string $salt): bool
    {
        return Hash::check($this->getCallbackSalt(), $salt);
    }

    public function getCallbackUrl(): string
    {
        return url()->route('api.v1.meetings.endcallback', ['meeting' => $this->meeting, 'salt' => Hash::make($this->getCallbackSalt())]);
    }

    /**
     * Start meeting with the properties saved for this meeting and room
     */
    public function start(): bool
    {
        // Set meeting parameters
        $meetingParams = new CreateMeetingParameters($this->meeting->id, $this->meeting->room->name);
        $meetingParams
            ->setLogoutURL(url('rooms/'.$this->meeting->room->id))
            ->setEndCallbackUrl($this->getCallbackUrl())
            ->setDuration($this->meeting->room->roomType->max_duration)
            ->setMaxParticipants($this->meeting->room->roomType->max_participants)
            ->setModeratorOnlyMessage($this->meeting->room->getModeratorOnlyMessage())
            ->setLockSettingsDisableMic($this->meeting->room->getRoomSetting('lock_settings_disable_mic'))
            ->setLockSettingsDisableCam($this->meeting->room->getRoomSetting('lock_settings_disable_cam'))
            ->setWebcamsOnlyForModerator($this->meeting->room->getRoomSetting('webcams_only_for_moderator'))
            ->setLockSettingsDisablePrivateChat($this->meeting->room->getRoomSetting('lock_settings_disable_private_chat'))
            ->setLockSettingsDisablePublicChat($this->meeting->room->getRoomSetting('lock_settings_disable_public_chat'))
            ->setLockSettingsDisableNotes($this->meeting->room->getRoomSetting('lock_settings_disable_note'))
            ->setLockSettingsHideUserList($this->meeting->room->getRoomSetting('lock_settings_hide_user_list'))
            ->setLockSettingsLockOnJoin(true)
            ->setMuteOnStart($this->meeting->room->getRoomSetting('mute_on_start'))
            ->setMeetingLayout(MeetingLayout::CUSTOM_LAYOUT)
            ->setDisabledFeatures([Feature::LEARNING_DASHBOARD]);

        $meetingParams->addMeta('bbb-origin', 'PILOS');

        // get files that should be used in this meeting and add links to the files
        $files = $this->meeting->room->files()->where('use_in_meeting', true)->orderBy('default', 'desc')->get();
        foreach ($files as $file) {
            $meetingParams->addPresentation((new RoomFileService($file))->url(), null, preg_replace("/[^A-Za-z0-9.-_\(\)]/", '', $file->filename));
        }

        if (empty($meetingParams->getPresentations()) && ! empty(setting('default_presentation'))) {
            $meetingParams->addPresentation(setting('default_presentation'));
        }

        // Set welcome message if expert mode is activated
        if ($this->meeting->room->expert_mode) {
            $meetingParams->setWelcome($this->meeting->room->welcome);
        }

        // set guest policy
        if ($this->meeting->room->getRoomSetting('lobby') == RoomLobby::ENABLED) {
            $meetingParams->setGuestPolicyAskModerator();
        }
        if ($this->meeting->room->getRoomSetting('lobby') == RoomLobby::ONLY_GUEST) {
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
            // Remove meeting and handle failed api call
            $this->meeting->forceDelete();
            $this->serverService->handleApiCallFailed();

            return false;
        }

        // Check server response for meeting creation
        if (! $result->success()) {
            // Meeting creation failed, remove meeting
            $this->meeting->forceDelete();
            // Check for some errors
            switch ($result->getMessageKey()) {
                // checksum error, api token invalid, handle api error, try to create on other server
                case 'checksumError':
                    $this->serverService->handleApiCallFailed();

                    break;
                    // for other unknown reasons, just respond, that room creation failed
                    // the error is probably server independent
                default:
                    break;
            }

            return false;
        }

        return true;
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
            Log::warning('Checking if room {room} is running on server {server} failed', ['room' => $this->meeting->room->getLogLabel(), 'server' => $this->meeting->server->getLogLabel()]);

            throw $exception;
        }

        return $response->success();
    }

    /**
     * End meeting
     *
     * @throws \Exception e.g. Connection error
     */
    public function end(): void
    {
        $endParams = new EndMeetingParameters($this->meeting->id);
        $this->serverService->getBigBlueButton()->endMeeting($endParams);
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

    public function updateAttendance(\BigBlueButton\Core\Meeting $bbbMeeting)
    {
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
                        $meetingAttendee = MeetingAttendee::where('meeting_id', $this->meeting->id)->where('user_id', $id)->whereNull('leave')->orderBy('join')->first();
                        // if no previous currently active attendance found in database, create new attendance
                        if ($meetingAttendee == null) {
                            $meetingAttendee = new MeetingAttendee();
                            $meetingAttendee->meeting()->associate($this->meeting);
                            $meetingAttendee->user()->associate($user);
                            $meetingAttendee->join = now();
                            $meetingAttendee->save();
                        }
                        // add found or created record to list of new or existing attendances
                        array_push($newAndExistingAttendees, $meetingAttendee->id);
                    } else {
                        // user was not found in database
                        \Illuminate\Support\Facades\Log::notice('Attendee user not found.', ['user' => $id, 'meeting' => $this->meeting->id]);
                    }

                    break;
                case 's': // users, identified by their session id
                    // check if user is marked in the database as still attending
                    $meetingAttendee = MeetingAttendee::where('meeting_id', $this->meeting->id)->where('session_id', $id)->whereNull('leave')->orderBy('join')->first();
                    // if no previous currently active attendance found in database, create new attendance
                    if ($meetingAttendee == null) {
                        $meetingAttendee = new MeetingAttendee();
                        $meetingAttendee->meeting()->associate($this->meeting);
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
                    Log::notice('Unknown prefix for attendee found.', ['prefix' => $prefix, 'meeting' => $this->meeting->id]);

                    break;
            }
        }

        // get all active attendees from database
        $allAttendees = MeetingAttendee::where('meeting_id', $this->meeting->id)->whereNull('leave')->get();
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

    /**
     * Collection of the attendance of users and guests
     * Multiple sessions of the same user/guest are grouped and the length of each session summed
     */
    public function attendance(): Collection|\Illuminate\Support\Collection
    {
        // Load guest and user attendances, group by session or user_id
        $guests = $this->meeting->attendees()->whereNotNull('session_id')->get()->groupBy('session_id');
        $users = $this->meeting->attendees()->whereNotNull('user_id')->get()->groupBy('user_id');

        // create array of guest attendees
        $guests = $guests->map(function ($guest) {
            $sessions = $this->mapAttendanceSessions($guest);

            return ['name' => $guest[0]->name, 'email' => null, 'duration' => $sessions->sum('duration'), 'sessions' => $sessions];
        });

        // create array of user attendees
        $users = $users->map(function ($user) {
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
     */
    private function mapAttendanceSessions($sessions): mixed
    {
        return $sessions->map(function ($session) {
            return ['id' => $session->id, 'join' => $session->join, 'leave' => $session->leave, 'duration' => (int) $session->join->diffInMinutes($session->leave)];
        });
    }

    /**
     * @param  mixed  $token
     * @param  Room  $room
     */
    public function getJoinUrl(StartJoinMeeting $request): string
    {
        $roomAuthService = app()->make(RoomAuthService::class);
        $token = $roomAuthService->getRoomToken($this->meeting->room);

        if (Auth::guest()) {
            if ($token) {
                $name = $token->fullname;
            } else {
                $name = $request->name;
            }
        } else {
            $name = Auth::user()->fullname;
        }

        $userId = Auth::guest() ? 's'.session()->getId() : 'u'.Auth::user()->id;
        $roomUserRole = $this->meeting->room->getRole(Auth::user(), $token);

        $bbbRole = match ($roomUserRole) {
            RoomUserRole::MODERATOR, RoomUserRole::CO_OWNER, RoomUserRole::OWNER => Role::MODERATOR,
            default => Role::VIEWER,
        };

        $joinMeetingParams = new JoinMeetingParameters($this->meeting->id, $name, $bbbRole);
        $joinMeetingParams->setRedirect(true);
        $joinMeetingParams->setErrorRedirectUrl(url('rooms/'.$this->meeting->room->id));
        $joinMeetingParams->setUserID($userId);
        $joinMeetingParams->setAvatarURL(Auth::user() ? Auth::user()->imageUrl : null);
        if ($roomUserRole == RoomUserRole::GUEST) {
            $joinMeetingParams->setGuest(true);
        }
        $joinMeetingParams->addUserData('bbb_skip_check_audio', Auth::user() ? Auth::user()->bbb_skip_check_audio : false);

        // If a custom style file is set, pass url to bbb html5 client
        if (setting()->has('bbb_style')) {
            $joinMeetingParams->addUserData('bbb_custom_style_url', setting('bbb_style'));
        }

        return $this->serverService->getBigBlueButton()->getJoinMeetingURL($joinMeetingParams);
    }
}
