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
        // Ensure you call the parent constructor
        parent::__construct($resource);
        $this->resource = $resource;

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
            'id'          => $this->id,
            'name'        => $this->name,
            'owner'       => $this->owner->firstname.' '.$this->owner->lastname,
            'type'        => new RoomType($this->roomType),
            'loggedIn' => $this->loggedIn,
            'requireAuth' => (Auth::user() && $this->members->contains(Auth::user())) ? false : $this->accessCode!=null,
            'allowMembership' => Auth::user() && $this->allowSubscription,
            'requireMembership' => $this->securityLevel == RoomSecurityLevel::PRIVATE,
            'isMember' => (Auth::user() && $this->members->contains(Auth::user())),
            'canStart' =>  $this->canStart(Auth::user()),
            'running' => $this->runningMeeting()!=null,
            'guest' => Auth::guest(),
            'user' => Auth::user(),
            'accessCode'  => $this->when($this->owner->is(Auth::user()), $this->accessCode),
            'settings'    => $this->when($this->owner->is(Auth::user()), new RoomSettings($this)),
            'users'       => $this->when($this->owner->is(Auth::user()), RoomUser::collection($this->members)),
        ];
    }
}
