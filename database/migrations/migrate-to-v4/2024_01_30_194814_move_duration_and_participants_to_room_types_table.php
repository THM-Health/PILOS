<?php

// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
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
        Schema::table('room_types', function (Blueprint $table) {
            $table->integer('max_participants')->nullable();
            $table->integer('max_duration')->nullable();
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
            $table->dropColumn('max_duration');
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->integer('max_participants')->nullable();
            $table->integer('duration')->nullable();
        });
    }
};
