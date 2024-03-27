<?php

namespace App\Plugins\Contracts;

use BigBlueButton\Core\Meeting;

interface ServerLoadCalculationPluginContract
{
    /**
     * @param  Meeting[]  $meetings
     */
    public function getLoad(array $meetings): int;
}
