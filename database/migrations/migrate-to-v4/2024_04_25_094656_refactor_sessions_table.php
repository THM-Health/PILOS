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
        Schema::table('session_data', function (Blueprint $table) {
            $table->dropForeign(['session_id']);
        });

        Schema::table('sessions', function (Blueprint $table) {
            $table->primary('id');
            $table->dropUnique(['id']);
        });

        Schema::table('session_data', function (Blueprint $table) {
            $table->foreign('session_id')
                ->references('id')->on('sessions')
                ->onUpdate('cascade')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('session_data', function (Blueprint $table) {
            $table->dropForeign(['session_id']);
        });

        Schema::table('sessions', function (Blueprint $table) {
            $table->unique('id');
            $table->dropPrimary('id');
        });

        Schema::table('session_data', function (Blueprint $table) {
            $table->foreign('session_id')
                ->references('id')->on('sessions')
                ->onUpdate('cascade')
                ->onDelete('cascade');
        });
    }
};
