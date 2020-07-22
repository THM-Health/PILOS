<?php

namespace App\Http\Resources;

use App\Enums\RoomSecurityLevel;
use Auth;
use Illuminate\Http\Resources\Json\JsonResource;

class Room extends JsonResource
{

    /**
     * @var
     */
    private $loggedIn;

    /**
     * Create a new resource instance.
     *
     * @param  mixed  $resource
     * @return void
     */
    public function __construct($resource, $loggedIn)
    {
        parent::__construct($resource);
        $this->loggedIn = $loggedIn;
    }

    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'owner'             => $this->owner->firstname.' '.$this->owner->lastname,
            'type'              => new RoomType($this->roomType),
            'loggedIn'          => $this->loggedIn,
            'allowMembership'   => Auth::user() && $this->allowSubscription,
            'isMember'          => (Auth::user() && $this->members->contains(Auth::user())),
            'isOwner'           => $this->owner->is(Auth::user()),
            'isGuest'           => Auth::guest(),
            'isModerator'       => $this->isModeratorOrOwner(Auth::user()),
            'canStart'          => $this->canStart(Auth::user()),
            'running'           => $this->runningMeeting()!=null,
            'accessCode'        => $this->when($this->isModeratorOrOwner(Auth::user()),$this->accessCode),
            'files'             => $this->when($this->loggedIn,RoomFile::collection($this->files()->where('download',true)->get()))
        ];
    }
}
