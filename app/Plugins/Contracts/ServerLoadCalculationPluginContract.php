<?php

namespace App\Plugins\Contracts;

use BigBlueButton\Core\Meeting;

interface ServerLoadCalculationPluginContract
{
    /**
     * Calculates and returns the server load based on the provided meetings.
     *
     * @param  Meeting[]  $meetings  An array of Meeting objects.
     * @return int The calculated server load.
     */
    public function getLoad(array $meetings): int;
}
