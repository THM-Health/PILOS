<?php

namespace App\Http\Resources;

use Auth;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

class Room extends JsonResource
{

    /**
     * @var bool is user authenticated (has valid access code, member or owner)
     */
    private $authenticated;
    private $details;

    /**
     * Create a new resource instance.
     *
     * @param mixed $resource
     * @param $authenticated boolean is user authenticated (has valid access code, member or owner)
     */
    public function __construct($resource, $authenticated, $details = false)
    {
        parent::__construct($resource);
        $this->authenticated = $authenticated;
        $this->details       = $details;
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
            'owner'             => $this->owner->fullname,
            'type'              => new RoomType($this->roomType),
            $this->mergeWhen($this->details, [
                'authenticated'     => $this->authenticated,
                'allowMembership'   => Auth::user() && $this->allowMembership,
                'isMember'          => $this->resource->isMember(Auth::user()),
                'isOwner'           => $this->owner->is(Auth::user()),
                'isGuest'           => Auth::guest(),
                'isModerator'       => $this->resource->isModeratorOrOwner(Auth::user()),
                'canStart'          => Gate::inspect('start', $this->resource)->allowed(),
                'running'           => $runningMeeting != null,
                'record_attendance' => $runningMeeting != null ? $runningMeeting->record_attendance : $this->resource->record_attendance,
                'accessCode'        => $this->when($this->resource->isModeratorOrOwner(Auth::user()), $this->accessCode),
            ])
        ];
    }
}
