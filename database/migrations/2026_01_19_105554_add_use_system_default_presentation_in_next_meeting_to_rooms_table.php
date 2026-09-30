<?php

declare(strict_types=1);

use App\Models\RoomFile;
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
            $table->boolean('use_system_default_presentation_in_meeting')->default(true);
            $table->boolean('prefer_system_default_presentation_as_default')->default(true);
        });

        RoomFile::where('default', true)
            ->where('use_in_meeting', true)
            ->each(function (RoomFile $file) {
                $file->room->prefer_system_default_presentation_as_default = false;
                $file->room->save();
            });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('use_system_default_presentation_in_meeting');
            $table->dropColumn('prefer_system_default_presentation_as_default');
        });
    }
};
