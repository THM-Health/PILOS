<?php

// SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

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
        Schema::table('room_tokens', function (Blueprint $table) {
            $table->dropPrimary();
            $table->dropForeign(['room_id']);
            $table->dropUnique(['token']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('room_tokens', function (Blueprint $table) {
            $table->primary(['token', 'room_id']);
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
            $table->unique('token');
        });
    }
};
