<?php

use App\Models\RoomType;
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
        Schema::table('room_types', function (Blueprint $table) {
            $table->integer('visibility_default')->default(\App\Enums\RoomVisibility::PRIVATE);
            $table->boolean('visibility_enforced')->default(false);
        });

        foreach (RoomType::all() as $roomType) {
            $roomType->visibility_default = $roomType->allow_listing ? \App\Enums\RoomVisibility::PUBLIC : \App\Enums\RoomVisibility::PRIVATE;

            if ($roomType->visibility_default == \App\Enums\RoomVisibility::PRIVATE) {
                $roomType->visibility_enforced = true;
            }

            $roomType->save();
        }

        Schema::table('room_types', function (Blueprint $table) {
            $table->dropColumn('allow_listing');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->boolean('allow_listing')->default(false);
        });

        foreach (RoomType::all() as $roomType) {
            // Disallow listing if visibility is enforced and default visibility is private
            $roomType->allow_listing = ! ($roomType->visibility_enforced && $roomType->visibility_default == \App\Enums\RoomVisibility::PRIVATE);

            $roomType->save();
        }

        Schema::table('room_types', function (Blueprint $table) {
            $table->dropColumn(['visibility_default', 'visibility_enforced']);
        });
    }
};
