<?php

namespace App\Plugins\Defaults;

use App\Plugins\Contracts\ServerLoadCalculationPluginContract;
use Carbon\Carbon;

class ServerLoadCalculationPlugin implements ServerLoadCalculationPluginContract
{
    public function getLoad(array $meetings): int
    {
        $load = 0;
        foreach ($meetings as $meeting) {
            // Do not count breakout rooms
            if ($meeting->isBreakout()) {
                continue;
            }

            $createdAt = Carbon::createFromTimestampMsUTC($meeting->getCreationTime());

            if ($createdAt->diffInMinutes(now()) < config('bigbluebutton.load_new_meeting_min_user_interval')) {

                // If meeting is in the starting phase, we use a higher number of users to calculate
                // the load to compensate that the meeting will probably have more users in the future
                $minUserCount = config('bigbluebutton.load_new_meeting_min_user_count');

                // However if the meeting has a max user limit the meeting will never go over that limit,
                // so we use the max user limit to calculate the load if it is lower than the min user count
                if ($meeting->getMaxUsers() > 0) {
                    $minUserCount = min($minUserCount, $meeting->getMaxUsers());
                }

                $load += max($minUserCount, $meeting->getParticipantCount());
            } else {
                $load += $meeting->getParticipantCount();
            }
        }

        return $load;
    }
}
