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
        Schema::table('room_personalized_links', function (Blueprint $table) {
            $table->id()->first();
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
            $table->unique('token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('room_personalized_links', function (Blueprint $table) {
            $table->dropColumn(['id']);
            $table->dropForeign(['room_id']);
            $table->dropUnique(['token']);
        });
    }
};
