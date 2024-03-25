<?php

namespace App\Console\Commands;

use App\Models\Room;
use App\Notifications\RoomExpires;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Log;

class CleanupRoomsCommand extends Command
{
    protected $signature = 'cleanup:rooms';

    protected $description = 'Send delete warning email to owners of unused rooms and delete rooms after a grace period';

    public function handle()
    {
        if (! setting('room_auto_delete.enabled') || (setting('room_auto_delete.inactive_period') == -1 && setting('room_auto_delete.never_used_period') == -1)) {
            return;
        }

        $lastStartDate = now()->subDays(setting('room_auto_delete.inactive_period'));
        $createdDate = now()->subDays(setting('room_auto_delete.never_used_period'));
        $timeToDeleteDate = now()->addDays(setting('room_auto_delete.deadline_period'));

        // Find ids of rooms that have never been used of the last meeting was a long time ago
        $inactiveRoomIDs = DB::table('rooms')
            ->leftJoin('meetings', 'rooms.meeting_id', '=', 'meetings.id')
            ->join('users', 'rooms.user_id', '=', 'users.id')
            ->select('rooms.id')
            ->whereNull('delete_inactive')
            ->where(function ($query) use ($createdDate, $lastStartDate) {
                $query->where(function ($query) use ($lastStartDate) {
                    if (setting('room_auto_delete.inactive_period') != -1) {
                        $query->where('meetings.start', '<', $lastStartDate);
                    }
                })
                    ->orWhere(function ($query) use ($createdDate) {
                        if (setting('room_auto_delete.never_used_period') != -1) {
                            $query->where('rooms.created_at', '<', $createdDate)
                                ->whereNull('meetings.start');
                        }
                    });
            })
            ->pluck('rooms.id');

        // Load rooms, set delete date and send an email notification to the room owner
        Log::info('Notifying '.count($inactiveRoomIDs).' room owners about their unused rooms');
        foreach ($inactiveRoomIDs as $inactiveRoomID) {
            $room = Room::find($inactiveRoomID);
            $room->delete_inactive = $timeToDeleteDate;
            $room->save();

            $room->owner->notify(new RoomExpires($room));
        }

        // Delete all rooms after the grace period
        $deleteRooms = Room::where('delete_inactive', '<', now())->get();
        Log::info('Removing '.count($deleteRooms).' unused rooms');
        foreach ($deleteRooms as $deleteRoom) {
            $deleteRoom->delete();
        }
    }
}
