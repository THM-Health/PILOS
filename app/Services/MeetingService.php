<?php

namespace App\Services;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Http\Requests\JoinMeeting;
use App\Http\Requests\StartMeeting;
use App\Models\Meeting;
use App\Models\MeetingAttendee;
use App\Models\Room;
use App\Models\User;
use App\Settings\BigBlueButtonSettings;
use Auth;
use BigBlueButton\Enum\Feature;
use BigBlueButton\Enum\Role;
use BigBlueButton\Parameters\CreateMeetingParameters;
use BigBlueButton\Parameters\EndMeetingParameters;
use BigBlueButton\Parameters\GetMeetingInfoParameters;
use BigBlueButton\Parameters\JoinMeetingParameters;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Log;
use ReflectionProperty;

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
    public function start(): ?\BigBlueButton\Responses\CreateMeetingResponse
    {
        // Set meeting parameters
        $meetingParams = new CreateMeetingParameters($this->meeting->id, $this->meeting->room->name);

        // Apply custom create parameters of the room type
        if ($this->meeting->room->roomType->create_parameters != null) {

            $result = self::setCustomCreateMeetingParameters($meetingParams, $this->meeting->room->roomType->create_parameters);

            // If setting custom parameters failed, we have to recreate the parameter object to reset it
            if (count($result) > 0) {
                $meetingParams = new CreateMeetingParameters($this->meeting->id, $this->meeting->room->name);
            }
        }

        // Room settings take precedence
        $meetingParams
            ->setRecord($this->meeting->record)
            ->setAutoStartRecording($this->meeting->room->auto_start_recording)
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
            ->setMuteOnStart($this->meeting->room->getRoomSetting('mute_on_start'));

        $meetingParams->addMeta('bbb-origin', 'PILOS');
        $meetingParams->addMeta('pilos-sub-spool-dir', config('recording.spool-sub-directory'));

        // get files that should be used in this meeting and add links to the files
        $files = $this->meeting->room->files()->where('use_in_meeting', true)->orderBy('default', 'desc')->get();
        foreach ($files as $file) {
            $meetingParams->addPresentation((new RoomFileService($file))->url(), null, preg_replace("/[^A-Za-z0-9.-_\(\)]/", '', $file->filename));
        }

        if (empty($meetingParams->getPresentations()) && app(BigBlueButtonSettings::class)->default_presentation) {
            $meetingParams->addPresentation(app(BigBlueButtonSettings::class)->default_presentation);
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
        if (app(BigBlueButtonSettings::class)->logo) {
            $meetingParams->setLogo(app(BigBlueButtonSettings::class)->logo);
        }

        // if a dark logo is defined, set dark logo
        if (app(BigBlueButtonSettings::class)->logo_dark) {
            $meetingParams->setDarklogo(app(BigBlueButtonSettings::class)->logo_dark);
        }

        // Try to start meeting
        try {
            $result = $this->serverService->getBigBlueButton()->createMeeting($meetingParams);
        } // Catch exceptions, e.g. network connection issues
        catch (\Exception $exception) {
            // Handle failed api call
            $this->serverService->handleApiCallFailed();

            return null;
        }

        // Check server response for meeting creation
        if (! $result->success()) {
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

            return null;
        }

        return $result;
    }

    /**
     * Set and validate custom parameters for creating a meeting.
     *
     * It reads the custom parameters from the room type of the meeting room and applies them to the meeting parameters.
     * Custom parameters are defined in the format "key=value" and separated by newlines.
     * If a key starts with "meta_", it is added as a meta parameter.
     * If a key corresponds to a property of the CreateMeetingParameters class, it is set by the corresponding setter method.
     * If the property is an array, the value is exploded by comma before passing it to the setter method.
     * If a key does not correspond to a meta parameter or a property of the CreateMeetingParameters class, a warning is logged.
     *
     * @param  CreateMeetingParameters  $meetingParams  The meeting parameters to which the custom parameters should be applied
     * @param  string  $createParameters  The custom parameters in the format "key=value" and separated by newlines
     * @return array An array of error messages
     */
    public static function setCustomCreateMeetingParameters(CreateMeetingParameters $meetingParams, string $createParameters): array
    {
        $errors = [];

        // Load custom create parameters of room type
        foreach (explode("\n", $createParameters) as $createParameter) {
            $parameterParts = explode('=', $createParameter, 2);
            $parameter = $parameterParts[0];

            // Skip empty lines
            if (empty($parameter)) {
                continue;
            }

            // Check for parameters with no value
            if (count($parameterParts) !== 2) {
                Log::warning('Custom create parameter {parameter} has no value', ['parameter' => $parameter]);

                $errors[] = __('validation.custom_create_parameter_missing', ['parameter' => $parameter]);

                continue;
            }

            $value = $parameterParts[1];

            // Set meta parameters
            if (Str::startsWith($parameter, 'meta_')) {
                $meta = Str::after($parameter, 'meta_');
                $meetingParams->addMeta($meta, $value);

                continue;
            }

            try {
                $reflectionProperty = new ReflectionProperty(CreateMeetingParameters::class, $parameter);

                // Get the type of the parameter to auto cast the value
                $typeName = $reflectionProperty->getType()->getName();

                // Integer
                if ($typeName == 'int') {
                    // check if string is an integer number using regex
                    if (! preg_match('/^[0-9]+$/', $value)) {
                        Log::warning('Custom create parameter {parameter} value {value} is not an integer', ['value' => $value, 'parameter' => $parameter]);

                        $errors[] = __('validation.custom_create_parameter_integer', ['parameter' => $parameter]);

                        continue;
                    }
                    $value = (int) $value;
                }

                // Boolean
                if ($typeName == 'bool') {
                    if ($value == 'true' || $value == 'false') {
                        $value = $value == 'true';
                    } else {
                        Log::warning('Custom create parameter {parameter} value {value} is not a boolean', ['value' => $value, 'parameter' => $parameter]);

                        $errors[] = __('validation.custom_create_parameter_boolean', ['parameter' => $parameter]);

                        continue;
                    }
                }

                // Arrays
                if ($typeName == 'array') {
                    $value = explode(',', $value);
                }

                // Special handling for disabledFeatures and disabledFeaturesExclude
                try {
                    if ($parameter == 'disabledFeatures' || $parameter == 'disabledFeaturesExclude') {
                        $value = array_map(function ($value) {
                            return Feature::from($value);
                        }, $value);
                    }
                } catch (\ValueError $e) {
                    Log::warning('Custom create parameter {parameter} value {value} is not an enum value', ['value' => $value, 'parameter' => $parameter]);

                    $errors[] = __('validation.custom_create_parameter_enum', ['parameter' => $parameter]);

                    continue;
                }

                // Custom types (e.g. enums)
                if (class_exists($typeName)) {
                    $reflectionClass = new \ReflectionClass($typeName);

                    // Enum
                    if ($reflectionClass->isEnum()) {
                        try {
                            $value = $typeName::from($value);
                        } catch (\ValueError $e) {
                            Log::warning('Custom create parameter {parameter} value {value} is not an enum value', ['value' => $value, 'parameter' => $parameter]);

                            $errors[] = __('validation.custom_create_parameter_enum', ['parameter' => $parameter]);

                            continue;
                        }
                    }
                }

                // Get the setter method for the parameter
                $setParamMethod = 'set'.ucfirst($parameter);

                // Set the parameter
                $meetingParams->$setParamMethod($value);
            } catch (\ReflectionException $e) {
                // Log a warning if a parameter cannot be found
                Log::warning('Custom create parameter {parameter} can not be found', ['parameter' => $parameter]);

                $errors[] = __('validation.custom_create_parameter_not_found', ['parameter' => $parameter]);
            } catch (\Throwable $e) {
                // Log a warning if a parameter cannot be set due to an error or exception
                Log::warning('Custom create parameter {parameter} can not be set', ['parameter' => $parameter, 'exception' => $e]);

                $errors[] = __('validation.custom_create_parameter_invalid', ['parameter' => $parameter]);
            }
        }

        // Try to create the query string to check for error that are not caught in the previous steps
        try {
            $meetingParams->getHTTPQuery();
        } catch (\Throwable $e) {
            Log::warning('Invalid create parameters', ['exception' => $e]);

            $errors[] = __('validation.custom_create_parameter_other_error');
        }

        return $errors;
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
                            $meetingAttendee = new MeetingAttendee;
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
                        $meetingAttendee = new MeetingAttendee;
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
     * @return string Join url
     */
    public function getJoinUrl(JoinMeeting|StartMeeting $request): string
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

        $joinMeetingParams->addUserData('bbb_record_video', $request->consent_record_video);

        // If a custom style file is set, pass url to bbb html5 client
        if (app(BigBlueButtonSettings::class)->style) {
            $joinMeetingParams->addUserData('bbb_custom_style_url', app(BigBlueButtonSettings::class)->style);
        }

        return $this->serverService->getBigBlueButton()->getJoinMeetingURL($joinMeetingParams);
    }
}
