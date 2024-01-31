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
            $table->integer('max_participants')->nullable();
            $table->integer('duration')->nullable();
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('max_participants');
            $table->dropColumn('duration');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->dropColumn('max_participants');
            $table->dropColumn('duration');
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->integer('max_participants')->nullable();
            $table->integer('duration')->nullable();
        });
    }
};
