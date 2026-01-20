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
            $table->boolean('use_system_default_presentation_in_meeting')->default(false);
            $table->boolean('use_system_default_presentation_as_default')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('use_system_default_presentation_in_meeting');
            $table->dropColumn('use_system_default_presentation_as_default');
        });
    }
};
