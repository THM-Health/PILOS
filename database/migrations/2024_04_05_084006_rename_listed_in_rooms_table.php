<?php

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
            $table->integer('visibility')->default(\App\Enums\RoomVisibility::PRIVATE);
        });

        foreach (\App\Models\Room::all() as $room) {
            $room->visibility = $room->listed ? \App\Enums\RoomVisibility::PUBLIC : \App\Enums\RoomVisibility::PRIVATE;

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

        foreach (\App\Models\Room::all() as $room) {
            $room->listed = $room->visibility ? \App\Enums\RoomVisibility::PUBLIC : \App\Enums\RoomVisibility::PRIVATE;

            $room->save();
        }

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('visibility');
        });
    }
};
