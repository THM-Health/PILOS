<?php

namespace App\Http\Resources;

use App\Http\Resources\User as UserResource;
use App\Models\RoomToken;
use App\Services\RoomAuthService;
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
    public function __construct($resource, bool $details = false)
    {
        parent::__construct($resource);
        $this->details       = $details;

        $roomAuthService     = app()->make(RoomAuthService::class);
        $this->token         = $roomAuthService->getRoomToken($resource);
        $this->authenticated = $roomAuthService->isAuthenticated($resource);
    }

    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request $request
     * @return array
     */
    public function toArray($request)
    {
        $runningMeeting = $this->resource->runningMeeting();

        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'owner'             => [
                'id'   => $this->owner->id,
                'name' => $this->owner->fullname,
            ],
            'running'           => $runningMeeting != null,
            'type'              => new RoomType($this->roomType),
            'model_name'        => $this->model_name,
            $this->mergeWhen($this->details, [
                'username'          => $this->when(!empty($this->token), !empty($this->token) ? $this->token->fullname : null),
                'authenticated'     => $this->authenticated,
                'description'       => $this->when($this->authenticated, $this->description),
                'allow_membership'  => $this->allow_membership,
                'is_member'         => $this->resource->isMember(Auth::user()),
                'is_moderator'      => $this->resource->isModerator(Auth::user()),
                'is_co_owner'       => $this->resource->isCoOwner(Auth::user()),
                'can_start'         => Gate::inspect('start', [$this->resource, $this->token])->allowed(),
                'access_code'       => $this->when(Gate::inspect('viewAccessCode', [$this->resource])->allowed(), $this->access_code),
                'room_type_invalid' => $this->roomTypeInvalid,
                'record_attendance' => !setting('attendance.enabled') ? false : ($runningMeeting != null ? $runningMeeting->record_attendance : $this->resource->record_attendance),
                'record'            => ($runningMeeting != null ? $runningMeeting->record : $this->resource->record),
                'current_user'      => (new UserResource(\Illuminate\Support\Facades\Auth::user()))->withPermissions()->withoutRoles()
            ])
        ];
    }
}
