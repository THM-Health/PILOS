<?php

declare(strict_types=1);

namespace App\Observers;

use App\Enums\RoomAuthTokenType;
use App\Exceptions\RoomIdGenerationFailed;
use App\Models\Room;
use App\Models\RoomAuthToken;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RoomObserver
{
    /**
     * Handle the Room "creating" event.
     */
    public function creating(Room $room): void
    {
        // if the meeting has no ID yet, create a unique id
        // 36^9 possible room ids ≈ 10^14

        if (! $room->id) {
            $count_tries = 0;
            $newId = null;
            while (true) {
                $count_tries++;
                if ($count_tries >= config('bigbluebutton.room_id_max_tries')) {
                    throw new RoomIdGenerationFailed;
                }

                $newId = implode('-', str_split(Str::lower(Str::random(9)), 3));
                if (DB::table('rooms')->where('id', 'LIKE', $newId)->doesntExist()) {
                    break;
                }
            }
            $room->id = $newId;
        }
    }

    /**
     * Handle the Room "updated" event.
     */
    public function updated(Room $room): void
    {
        if ($room->access_code !== $room->getOriginal('access_code')) {
            // Access code has changed
            // Delete all room auth tokens with type CODE linked to this room
            RoomAuthToken::where('room_id', $room->id)
                ->where('type', RoomAuthTokenType::CODE)
                ->delete();
        }
    }

    /**
     * Handle the Room "deleting" event.
     */
    public function deleting(Room $room): void
    {
        $room->files->each->delete();
        $room->recordings->each->delete();
        Storage::deleteDirectory($room->id);
    }
}
