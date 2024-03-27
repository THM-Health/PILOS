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
        Schema::table('servers', function (Blueprint $table) {
            $table->integer('error_count')->default(0);
            $table->integer('recover_count')->default(0);
        });

        // Migrate the status column to health counters and status
        foreach (\App\Models\Server::all() as $server) {

            switch ($server->getRawOriginal('status')) {
                // Disabled
                case -1:
                    $server->status = \App\Enums\ServerStatus::DISABLED;
                    break;
                    // Offline
                case 0:
                    // Server is unhealthy, but not offline yet
                    $server->recover_count = 0;
                    $server->error_count = 0;
                    $server->status = \App\Enums\ServerStatus::ENABLED;
                    break;
                    // Online
                case 1:
                    // Server is healthy
                    $server->recover_count = config('bigbluebutton.server_healthy_threshold');
                    $server->error_count = 0;
                    $server->status = \App\Enums\ServerStatus::ENABLED;
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
