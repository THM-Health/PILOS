<?php

namespace App\Http\Resources;

use App\Http\Resources\User as UserResource;
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
    private $token;

    /**
     * Create a new resource instance.
     *
     * @param mixed $resource
     * @param $authenticated boolean is user authenticated (has valid access code, member or owner)
     */
    public function __construct($resource, $authenticated, $details = false, $token = null)
    {
        parent::__construct($resource);
        $this->authenticated = $authenticated;
        $this->details       = $details;
        $this->token         = $token;
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
            'type'              => new RoomType($this->roomType),
            'model_name'        => $this->model_name,
            $this->mergeWhen($this->details, [
                'username'          => $this->when(!empty($this->token), !empty($this->token) ? $this->token->fullname : null),
                'authenticated'     => $this->authenticated,
                'allowMembership'   => $this->allowMembership,
                'isMember'          => $this->resource->isMember(Auth::user()),
                'isModerator'       => $this->resource->isModerator(Auth::user(), $this->token),
                'isCoOwner'         => $this->resource->isCoOwner(Auth::user()),
                'canStart'          => Gate::inspect('start', [$this->resource, $this->token])->allowed(),
                'accessCode'        => $this->when(Gate::inspect('viewAccessCode', [$this->resource, $this->token])->allowed(), $this->accessCode),
                'roomTypeInvalid'   => $this->roomTypeInvalid,
                'running'           => $runningMeeting != null,
                'record_attendance' => !setting('attendance.enabled') ? false : ($runningMeeting != null ? $runningMeeting->record_attendance : $this->resource->record_attendance),
                'current_user'      => (new UserResource(\Illuminate\Support\Facades\Auth::user()))->withPermissions()
            ])
        ];
    }
}
