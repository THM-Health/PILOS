<?php

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

        // Migrate the status column to connection status counters and status
        foreach (Server::all() as $server) {

            switch ($server->getRawOriginal('status')) {
                case -1: // Disabled
                    $server->status = ServerStatus::DISABLED;
                    break;
                case 0: // Offline
                    // Server is faulty, but not offline yet
                    $server->recover_count = 0;
                    $server->error_count = 0;
                    $server->status = ServerStatus::ENABLED;
                    break;
                case 1: // Online
                    // Server is online
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
