<?php

namespace App\Plugins\Contracts;

use BigBlueButton\Parameters\JoinMeetingParameters;

interface JoinMeetingPluginContract
{
    /**
     * @param JoinMeetingParameters $joinMeetingParameters
     * @param string $config
     */
    public function modify(JoinMeetingParameters $joinMeetingParameters, ?string $config): void;
}
