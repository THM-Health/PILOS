<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class RoomSettings extends JsonResource
{

    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'name'                                  => $this->name,
            'roomType'                              => $this->roomType!=null ? $this->roomType->id : null,
            'roomTypes'                             => RoomType::collection(\App\RoomType::all()),
            'accessCode'                            => $this->accessCode,
            'muteOnStart'                           => $this->muteOnStart,
            'lockSettingsDisableCam'                => $this->lockSettingsDisableCam,
            'webcamsOnlyForModerator'               => $this->webcamsOnlyForModerator,
            'lockSettingsDisableMic'                => $this->lockSettingsDisableMic,
            'lockSettingsDisablePrivateChat'        => $this->lockSettingsDisablePrivateChat,
            'lockSettingsDisablePublicChat'         => $this->lockSettingsDisablePublicChat,
            'lockSettingsDisableNote'               => $this->lockSettingsDisableNote,
            'lockSettingsLockOnJoin'                => $this->lockSettingsLockOnJoin,
            'lockSettingsHideUserList'              => $this->lockSettingsHideUserList,
            'everyoneCanStart'                      => $this->everyoneCanStart,
            'securityLevel'                         => $this->securityLevel,
            'allowSubscription'                     => $this->allowSubscription,
            'welcome'                               => $this->welcome,
            'maxParticipants'                       => $this->maxParticipants,
            'duration'                              => $this->duration,
            'defaultRole'                           => $this->defaultRole,
            'lobby'                                 => $this->lobby,
        ];
    }
}
