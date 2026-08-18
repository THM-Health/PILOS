<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\RoomPersonalizedLink;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RoomPersonalizedLinkObserver
{
    /**
     * Handle the RoomPersonalizedLink "creating" event.
     */
    public function creating(RoomPersonalizedLink $personalizedLink): void
    {
        while (true) {
            $token = Str::random(100);
            if (DB::table('room_personalized_links')->where('token', '=', $token)->doesntExist()) {
                $personalizedLink->token = $token;

                break;
            }
        }
    }
}
