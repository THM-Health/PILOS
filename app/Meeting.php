<?php

namespace App;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use BigBlueButton\Parameters\CreateMeetingParameters;
use BigBlueButton\Parameters\JoinMeetingParameters;
use GoldSpecDigital\LaravelEloquentUUID\Database\Eloquent\Uuid;
use Illuminate\Database\Eloquent\Model;
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

    public function server()
    {
        return $this->belongsTo(Server::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function getCallbackHash()
    {
        return sha1( $this->id.$this->server->salt);
    }

    public function start()
    {
        $meetingParams = new CreateMeetingParameters($this->id, $this->room->name);
        $meetingParams->setModeratorPassword($this->moderatorPW)
           ->setAttendeePassword($this->attendeePW)
            ->setLogoutUrl(url('rooms/'.$this->room->id))
            ->setEndCallbackUrl(url()->route('api.v1.meetings.endcallback', ['meeting'=>$this,'salt'=>$this->getCallbackHash()]))
            ->setDuration($this->room->duration)
            ->setWelcomeMessage('<img src="http://10.84.5.161:8000/images/logo.svg" />'.$this->room->welcome)
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

        $files = $this->room->files()->where('useinmeeting', true)->orderBy('default', 'desc')->get();
        foreach ($files as $file) {
            $meetingParams->addPresentation(URL::signedRoute('download.file', ['roomFile' => $file->id,'filename'=>$file->filename]), null, preg_replace("/[^A-Za-z0-9.-_\(\)]/", '', $file->filename));
        }

        if ($this->room->lobby == RoomLobby::ENABLED) {
            $meetingParams->setGuestPolicyAskModerator();
        }
        if ($this->room->lobby == RoomLobby::ONLY_GUEST) {
            $meetingParams->setGuestPolicyAlwaysAcceptAuth();
        }

        return $this->server->bbb()->createMeeting($meetingParams)->success();
    }

    public function getJoinUrl($name, $role, $userid)
    {
        $joinMeetingParams = new JoinMeetingParameters($this->id, $name, $role == RoomUserRole::MODERATOR ? $this->moderatorPW : $this->attendeePW);
        $joinMeetingParams->setJoinViaHtml5(true);
        $joinMeetingParams->setRedirect(true);
        $joinMeetingParams->setUserId($userid);
        $joinMeetingParams->setGuest($role == RoomUserRole::GUEST);
        //$joinMeetingParams->setAuthenticated($role != RoomUserRole::GUEST);

        return $this->server->bbb()->getJoinMeetingURL($joinMeetingParams);
    }
}
