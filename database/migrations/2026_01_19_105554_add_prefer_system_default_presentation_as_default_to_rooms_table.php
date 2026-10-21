<?php

declare(strict_types=1);

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
            $table->boolean('prefer_system_default_presentation_as_default')->default(true);
        });

        DB::table('rooms')
            ->whereIn('id', function ($query) {
                $query->select('room_id')
                    ->from('room_files')
                    ->where('default', true)
                    ->where('use_in_meeting', true);
            })
            ->update(['prefer_system_default_presentation_as_default' => false]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('prefer_system_default_presentation_as_default');
        });
    }
};
