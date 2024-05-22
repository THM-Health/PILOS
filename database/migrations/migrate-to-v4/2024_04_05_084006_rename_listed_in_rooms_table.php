<?php

use App\Enums\RoomVisibility;
use App\Models\Room;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->integer('visibility')->default(RoomVisibility::PRIVATE);
        });

        foreach (Room::all() as $room) {
            $room->visibility = $room->listed ? RoomVisibility::PUBLIC : RoomVisibility::PRIVATE;

            $room->save();
        }

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('listed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->boolean('listed')->default(false);
        });

        foreach (Room::all() as $room) {
            $room->listed = $room->visibility == RoomVisibility::PUBLIC;

            $room->save();
        }

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('visibility');
        });
    }
};
