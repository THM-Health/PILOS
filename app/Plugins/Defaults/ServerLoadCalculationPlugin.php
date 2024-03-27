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
                $load += max(config('bigbluebutton.load_new_meeting_min_user_count'), $meeting->getParticipantCount());
            } else {
                $load += $meeting->getParticipantCount();
            }
        }

        return $load;
    }
}
