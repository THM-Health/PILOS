<?php

namespace App\Console\Commands;

use App\Enums\TimePeriod;
use App\Models\Room;
use App\Notifications\RoomExpires;
use App\Settings\RoomSettings;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Log;

class CleanupRoomsCommand extends Command
{
    protected $signature = 'cleanup:rooms';

    protected $description = 'Send delete warning email to owners of unused rooms and delete rooms after a grace period';

    public function handle()
    {
        $inactivePeriod = app(RoomSettings::class)->auto_delete_inactive_period;
        $neverUsedPeriod = app(RoomSettings::class)->auto_delete_never_used_period;
        $deadlinePeriod = app(RoomSettings::class)->auto_delete_deadline_period;

        // Check if both periods are unlimited, in that case we don't need to do anything
        // Do not remove, as this would result in the query to not filter at all!
        if ($inactivePeriod == TimePeriod::UNLIMITED && $neverUsedPeriod == TimePeriod::UNLIMITED) {
            return;
        }

        $lastStartDate = now()->subDays($inactivePeriod->value);
        $createdDate = now()->subDays($neverUsedPeriod->value);
        $timeToDeleteDate = now()->addDays($deadlinePeriod->value);

        // Find ids of rooms that have never been used of the last meeting was a long time ago
        $inactiveRoomIDs = DB::table('rooms')
            ->leftJoin('meetings', 'rooms.meeting_id', '=', 'meetings.id')
            ->join('users', 'rooms.user_id', '=', 'users.id')
            ->select('rooms.id')
            ->whereNull('delete_inactive')
            ->where(function ($query) use ($neverUsedPeriod, $inactivePeriod, $createdDate, $lastStartDate) {
                $query->where(function ($query) use ($inactivePeriod, $lastStartDate) {
                    if ($inactivePeriod != TimePeriod::UNLIMITED) {
                        $query->where('meetings.start', '<', $lastStartDate);
                    }
                })
                    ->orWhere(function ($query) use ($neverUsedPeriod, $createdDate) {
                        if ($neverUsedPeriod != TimePeriod::UNLIMITED) {
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
