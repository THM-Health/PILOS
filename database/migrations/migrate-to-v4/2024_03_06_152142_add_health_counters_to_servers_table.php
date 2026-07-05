<?php

// SPDX-FileCopyrightText: 2023 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

use App\Enums\ServerStatus;
use App\Models\Server;
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
        Schema::table('servers', function (Blueprint $table) {
            $table->integer('error_count')->default(0);
            $table->integer('recover_count')->default(0);
        });

        // Migrate the status column to health counters and status
        foreach (Server::all() as $server) {

            switch ($server->getRawOriginal('status')) {
                // Disabled
                case -1:
                    $server->status = ServerStatus::DISABLED;
                    break;
                    // Offline
                case 0:
                    // Server is unhealthy, but not offline yet
                    $server->recover_count = 0;
                    $server->error_count = 0;
                    $server->status = ServerStatus::ENABLED;
                    break;
                    // Online
                case 1:
                    // Server is healthy
                    $server->recover_count = config('bigbluebutton.server_online_threshold');
                    $server->error_count = 0;
                    $server->status = ServerStatus::ENABLED;
                    break;
            }

            $server->save();
        }

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropColumn(['error_count', 'recover_count']);
        });
    }
};
