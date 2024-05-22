<?php

namespace App\Plugins\Contracts;

use App\Models\Meeting;
use App\Models\Room;
use App\Models\User;
use BigBlueButton\Parameters\CreateMeetingParameters;

interface CreateMeetingPluginContract
{
    /**
     * @param CreateMeetingParameters $createMeetingParameters
     * @param Meeting $meeting
     * @param Room $room
     * @param User $owner
     * @param string|null $pluginConfig
     */
    public function modify(CreateMeetingParameters $createMeetingParameters, Meeting $meeting, Room $room, User $owner, ?string $pluginConfig): void;
}
