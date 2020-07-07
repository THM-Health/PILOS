<?php

namespace App;

use App\Enums\RoomUserRole;
use BigBlueButton\Parameters\CreateMeetingParameters;
use BigBlueButton\Parameters\JoinMeetingParameters;
use GoldSpecDigital\LaravelEloquentUUID\Database\Eloquent\Uuid;
use Illuminate\Database\Eloquent\Model;

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

    public function getCallbackHash(){
        return sha1( $this->id.$this->server->salt);
    }

    public function start(){
        $meetingParams = new CreateMeetingParameters($this->id,$this->room->name);
        $meetingParams->setModeratorPassword($this->moderatorPW);
        $meetingParams->setAttendeePassword($this->attendeePW);
        $meetingParams->setLogoutUrl(url("rooms/".$this->room->id));
        $meetingParams->setEndCallbackUrl(url()->route('api.v1.meetings.endcallback',['meeting'=>$this,'salt'=>$this->getCallbackHash()]));
        return $this->server->bbb()->createMeeting($meetingParams)->success();
    }

    public function getJoinUrl($name,$role){

        $joinMeetingParams = new JoinMeetingParameters($this->id,$name, $role == RoomUserRole::MODERATOR ? $this->moderatorPW : $this->attendeePW);
        $joinMeetingParams->setJoinViaHtml5(true);
        $joinMeetingParams->setRedirect(true);
        $joinMeetingParams->setGuest($role == RoomUserRole::GUEST);
        return $this->server->bbb()->getJoinMeetingURL($joinMeetingParams);
    }
}
