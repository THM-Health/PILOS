<?php

namespace App;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use BigBlueButton\Parameters\CreateMeetingParameters;
use BigBlueButton\Parameters\EndMeetingParameters;
use BigBlueButton\Parameters\IsMeetingRunningParameters;
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
     * Callback-hash for his meeting and server, required to validate incoming end of meeting request
     * @return string
     */
    public function getCallbackHash()
    {
        return Hash::make( $this->id.$this->server->salt);
    }

    /**
     * Start this meeting with the properties saved for this meeting and room
     * @return boolean Meeting was successfully started
     */
    public function start()
    {
        // Set meeting parameters
        // TODO user limit, not working properly with bbb at the moment
        $meetingParams = new CreateMeetingParameters($this->id, $this->room->name);
        $meetingParams->setModeratorPassword($this->moderatorPW)
           ->setAttendeePassword($this->attendeePW)
            ->setLogoutUrl(url('rooms/'.$this->room->id))
            ->setEndCallbackUrl(url()->route('api.v1.meetings.endcallback', ['meeting'=>$this,'salt'=>$this->getCallbackHash()]))
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
            $meetingParams->addPresentation($file->bbbDownloadLink(), null, preg_replace("/[^A-Za-z0-9.-_\(\)]/", '', $file->filename));
        }

        // set guest policy
        if ($this->room->lobby == RoomLobby::ENABLED) {
            $meetingParams->setGuestPolicyAskModerator();
        }
        if ($this->room->lobby == RoomLobby::ONLY_GUEST) {
            $meetingParams->setGuestPolicyAlwaysAcceptAuth();
        }

        return $this->server->bbb()->createMeeting($meetingParams)->success();
    }

    /**
     * Is Meeting running
     * @return bool
     */
    public function isRunning()
    {
        $isMeetingRunningParams = new IsMeetingRunningParameters($this->id);
        $response               = $this->server->bbb()->isMeetingRunning($isMeetingRunningParams);

        return $response->success() && $response->isRunning();
    }

    /**
     * End meeting
     * @return boolean
     */
    public function end()
    {
        $endParams = new EndMeetingParameters($this->id, $this->moderatorPW);

        return $this->server->bbb()->endMeeting($endParams)->success();
    }

    /**
     * Create a join url for this meeting
     * @param $name string Name of the user
     * @param $role RoomUserRole Role of the user inside the meeting
     * @param $userid integer unique identifier for this user/guest
     * @return mixed
     */
    public function getJoinUrl($name, $role, $userid)
    {
        $joinMeetingParams = new JoinMeetingParameters($this->id, $name, $role == RoomUserRole::MODERATOR ? $this->moderatorPW : $this->attendeePW);
        $joinMeetingParams->setJoinViaHtml5(true);
        $joinMeetingParams->setRedirect(true);
        $joinMeetingParams->setUserId($userid);
        $joinMeetingParams->setGuest($role == RoomUserRole::GUEST);

        return $this->server->bbb()->getJoinMeetingURL($joinMeetingParams);
    }
}
