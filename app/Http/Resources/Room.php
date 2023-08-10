<?php

namespace App\Http\Resources;

use App\Http\Resources\User as UserResource;
use Auth;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

class Room extends JsonResource
{
    // Is user authenticated (has valid access code, member or owner)
    private bool $authenticated;

    // Show details of the room (otherwise only basic information for listing is shown)
    private bool $details;

    // The token used to authenticate the user
    private ?RoomToken $token;

    /**
     * Create a new resource instance.
     *
     * @param mixed     $resource
     * @param boolean   $authenticated Is user authenticated (has valid access code, member or owner)
     * @param boolean   $details       Show details of the room (otherwise only basic information for listing is shown)
     * @param RoomToken $token         The token used to authenticate the user
     */
    public function __construct($resource, bool $authenticated, bool $details = false, ?RoomToken $token = null)
    {
        parent::__construct($resource);
        $this->authenticated = $authenticated;
        $this->details       = $details;
        $this->token         = $token;
    }

    public function getDetails($latestMeeting)
    {
        if (!$this->details) {
            return [];
        }

        return [
            'username'          => $this->when(!empty($this->token), !empty($this->token) ? $this->token->fullname : null),
            'authenticated'     => $this->authenticated,
            'description'       => $this->when($this->authenticated, $this->description),
            'allow_membership'  => $this->allow_membership,
            'is_member'         => $this->resource->isMember(Auth::user()),
            'is_moderator'      => $this->resource->isModerator(Auth::user(), $this->token),
            'is_co_owner'       => $this->resource->isCoOwner(Auth::user()),
            'can_start'         => Gate::inspect('start', [$this->resource, $this->token])->allowed(),
            'access_code'       => $this->when(Gate::inspect('viewAccessCode', [$this->resource])->allowed(), $this->access_code),
            'room_type_invalid' => $this->roomTypeInvalid,
            'record_attendance' => !setting('attendance.enabled') ? false : (($latestMeeting != null && $latestMeeting->end == null) ? $latestMeeting->record_attendance : $this->resource->record_attendance),
            'current_user'      => (new UserResource(\Illuminate\Support\Facades\Auth::user()))->withPermissions()->withoutRoles()
        ];
    }

    public function getLastMeeting($latestMeeting)
    {
        if (!$latestMeeting) {
            return null;
        }

        return [
            'start' => $latestMeeting->start,
            'end'   => $latestMeeting->end
        ];
    }

    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request $request
     * @return array
     */
    public function toArray($request)
    {
        $latestMeeting = $this->resource->latestMeeting;

        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'owner'             => [
                'id'   => $this->owner->id,
                'name' => $this->owner->fullname,
            ],
            'last_meeting'          => $this->getLastMeeting($latestMeeting),
            'type'                  => new RoomType($this->roomType),
            'model_name'            => $this->model_name,
            'short_description'     => $this->short_description,
            'is_favourite'          => Auth::user()?Auth::user()->roomFavorites->contains($this->id):false,
            $this->mergeWhen($this->details, $this->getDetails($latestMeeting))
        ];
    }
}
