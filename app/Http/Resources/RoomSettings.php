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
            'muteOnStart'                           => $this->muteOnStart,
            'lockSettingsDisableCam'                => $this->lockSettingsDisableCam,
            'webcamsOnlyForModerator'               => $this->webcamsOnlyForModerator,
            'lockSettingsDisableMic'                => $this->lockSettingsDisableMic,
            'lockSettingsDisablePrivateChat'        => $this->lockSettingsDisablePrivateChat,
            'lockSettingsDisablePublicChat'         => $this->lockSettingsDisablePublicChat,
            'lockSettingsDisableNote'               => $this->lockSettingsDisableNote,
            'everyoneCanStart'                      => $this->everyoneCanStart,
            'securityLevel'                         => $this->securityLevel,
            'welcome'                               => $this->welcome,
            'maxParticipants'                       => $this->maxParticipants,
            'duration'                              => $this->duration,
        ];
    }
}
