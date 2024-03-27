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
    private bool $withDetails = false;

    /**
     * Sets the flag to also load the permissions of the role model.
     *
     * @return $this The role resource instance.
     */
    public function withDetails()
    {
        $this->withDetails = true;

        return $this;
    }

    // The token used to authenticate the user
    private ?RoomToken $token;

    /**
     * Create a new resource instance.
     *
     * @param  mixed  $resource
     */
    public function __construct($resource)
    {
        parent::__construct($resource);

        $roomAuthService = app()->make(RoomAuthService::class);
        $this->token = $roomAuthService->getRoomToken($resource);
        $this->authenticated = $roomAuthService->isAuthenticated($resource);
    }

    public function getDetails($latestMeeting)
    {
        if (! $this->withDetails) {
            return [];
        }

        return [
            'username' => $this->when(! empty($this->token), ! empty($this->token) ? $this->token->fullname : null),
            'authenticated' => $this->authenticated,
            'description' => $this->when($this->authenticated, $this->description),
            'allow_membership' => $this->allow_membership,
            'is_member' => $this->resource->isMember(Auth::user()),
            'is_moderator' => $this->resource->isModerator(Auth::user(), $this->token),
            'is_co_owner' => $this->resource->isCoOwner(Auth::user()),
            'can_start' => Gate::inspect('start', [$this->resource, $this->token])->allowed(),
            'access_code' => $this->when(Gate::inspect('viewAccessCode', [$this->resource])->allowed(), $this->access_code),
            'room_type_invalid' => $this->roomTypeInvalid,
            'record_attendance' => ($latestMeeting != null && $latestMeeting->end == null) ? $latestMeeting->record_attendance : ($this->resource->record_attendance && $this->roomType->allow_record_attendance),
            'record' => ($latestMeeting != null && $latestMeeting->end == null) ? $latestMeeting->record : ($this->resource->record && $this->roomType->allow_record),
            'current_user' => (new UserResource(\Illuminate\Support\Facades\Auth::user()))->withPermissions()->withoutRoles(),
        ];
    }

    public function getLastMeeting($latestMeeting)
    {
        if (! $latestMeeting) {
            return null;
        }

        return [
            'start' => $latestMeeting->start,
            'end' => $latestMeeting->end,
            'detached' => $latestMeeting->detached,
            'usage' => $this->when($latestMeeting->end == null, [
                'participant_count' => $this->participant_count,
            ]),
            'server_connection_issues' => $latestMeeting->end == null && $latestMeeting->server->error_count > 0,
        ];
    }

    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        $latestMeeting = $this->resource->latestMeeting;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'owner' => [
                'id' => $this->owner->id,
                'name' => $this->owner->fullname,
            ],
            'last_meeting' => $this->getLastMeeting($latestMeeting),
            'type' => new RoomType($this->roomType),
            'model_name' => $this->model_name,
            'short_description' => $this->short_description,
            'is_favorite' => Auth::user() ? Auth::user()->roomFavorites->contains($this->id) : false,
            $this->mergeWhen($this->withDetails, $this->getDetails($latestMeeting)),
        ];
    }
}
