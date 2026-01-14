<?php

namespace App\Observers;

use App\Models\RoomToken;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RoomTokenObserver
{
    /**
     * Handle the RoomToken "creating" event.
     */
    public function creating(RoomToken $roomToken): void
    {
        while (true) {
            $token = Str::random(100);
            if (DB::table('room_tokens')->where('token', '=', $token)->doesntExist()) {
                $roomToken->token = $token;

                break;
            }
        }
    }
}
