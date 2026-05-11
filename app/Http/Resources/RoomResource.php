<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\RoomPersonalizedLink;
use App\Settings\RoomSettings;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Gate;

class RoomResource extends JsonResource
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

    // The personalized link used to authenticate the user
    private ?RoomPersonalizedLink $personalizedLink;

    /**
     * Create a new resource instance.
     *
     * @param  mixed  $resource
     */
    public function __construct($resource)
    {
        parent::__construct($resource);

        $this->personalizedLink = Context::getHidden("room.{$resource->id}.personalized_link");
        $this->authenticated = Context::getHidden("room.{$resource->id}.authenticated") === true;
    }

    public function getDetails($latestMeeting)
    {
        if (! $this->withDetails) {
            return [];
        }

        return [
            'username' => $this->when(! empty($this->personalizedLink), $this->personalizedLink?->fullname),
            'authenticated' => $this->authenticated,
            'legacy_code' => $this->hasLegacyCode,
            'description' => $this->when($this->authenticated, $this->description),
            'allow_membership' => $this->getRoomSetting('allow_membership'),
            'is_member' => $this->resource->isMember(Auth::user()),
            'is_moderator' => $this->resource->isModerator(Auth::user()),
            'is_co_owner' => $this->resource->isCoOwner(Auth::user()),
            'can_start' => Gate::inspect('start', [$this->resource])->allowed(),
            'access_code' => $this->when(Gate::inspect('viewAccessCode', [$this->resource])->allowed(), $this->access_code),
            'room_type_invalid' => $this->roomTypeInvalid,
            'current_user' => new UserResource(Auth::user())->withPermissions()->withoutRoles(),
        ];
    }

    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array
     */
    public function toArray($request)
    {
        $latestMeeting = $this->resource->latestMeeting;
        // Set the room relation for the latest meeting, to prevent lookup in the  LastMeeting resource
        if ($latestMeeting) {
            $latestMeeting->setRelation('room', $this->resource);
        }

        $roomSettings = app(RoomSettings::class);

        // Check if user is authenticated or room owner should be shown to everyone
        $showOwner = Auth::check() || ! $roomSettings->hide_owner_from_guests;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'owner' => $this->when($showOwner, fn () => [
                'id' => $this->owner->id,
                'name' => $this->owner->fullname,
            ]),
            'last_meeting' => new LastMeetingResource($latestMeeting),
            'type' => new RoomTypeResource($this->roomType)->withFeatures(),
            'model_name' => $this->model_name,
            'short_description' => $this->short_description,
            'is_favorite' => Auth::user() ? Auth::user()->roomFavorites->contains($this->id) : false,
            $this->mergeWhen($this->withDetails, $this->getDetails($latestMeeting)),
        ];
    }
}
