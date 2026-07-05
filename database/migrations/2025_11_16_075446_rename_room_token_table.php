<?php

// SPDX-FileCopyrightText: 2023 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::rename('room_tokens', 'room_personalized_links');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::rename('room_personalized_links', 'room_tokens');
    }
};
