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
        Schema::table('room_types', function (Blueprint $table) {
            $table->boolean('record_default')->default(false);
            $table->boolean('record_enforced')->default(false);

            $table->boolean('auto_start_recording_default')->default(false);
            $table->boolean('auto_start_recording_enforced')->default(false);

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->dropColumn(['record_default', 'record_enforced']);
            $table->dropColumn(['auto_start_recording_default', 'auto_start_recording_enforced']);
        });
    }
};
