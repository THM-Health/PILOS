<?php

declare(strict_types=1);

namespace App\Observers;

use App\Enums\ServerHealth;
use App\Enums\ServerStatus;
use App\Models\Server;
use Illuminate\Support\Facades\Log;

class ServerObserver
{
    /**
     * Handle the Server "updating" event.
     */
    public function updating(Server $server): void
    {
        /**
         * If status is changed and new status is disabled, reset live usage data
         */
        if ($server->status != $server->getOriginal('status')) {
            if ($server->status == ServerStatus::DISABLED) {
                $server->version = null;
                $server->participant_count = null;
                $server->listener_count = null;
                $server->voice_participant_count = null;
                $server->video_count = null;
                $server->meeting_count = null;
            }
        }
    }

    /**
     * Handle the Server "updated" event.
     */
    public function updated(Server $server): void
    {
        // Check if server is failing (error count increased or recover count decreased)
        if ($server->error_count > $server->getOriginal('error_count') || $server->recover_count < $server->getOriginal('recover_count')) {
            Log::error('Server {server} failing', [
                'server' => $server->getLogLabel(),
                'error_count' => $server->error_count,
                'old_error_count' => $server->getOriginal('error_count'),
            ]);
        }

        // Check if server is recovering (recover count increased)
        if ($server->recover_count > $server->getOriginal('recover_count')) {
            Log::notice('Server {server} recovering', [
                'server' => $server->getLogLabel(),
                'recover_count' => $server->recover_count,
                'old_recover_count' => $server->getOriginal('recover_count'),
            ]);
        }

        // Check if server health changed
        $newHealth = Server::calcHealth($server->recover_count, $server->error_count);
        $previousHealth = Server::calcHealth($server->getOriginal('recover_count'), $server->getOriginal('error_count'));
        if ($newHealth != $previousHealth) {
            if ($newHealth == ServerHealth::OFFLINE) {
                Log::error('Server {server} health changed to offline', [
                    'server' => $server->getLogLabel(),
                    'old_health' => $previousHealth->name,
                ]);
            }

            if ($newHealth == ServerHealth::UNHEALTHY) {
                Log::warning('Server {server} health changed to unhealthy', [
                    'server' => $server->getLogLabel(),
                    'old_health' => $previousHealth->name,
                ]);
            }

            if ($newHealth == ServerHealth::ONLINE) {
                Log::notice('Server {server} health changed to healthy', [
                    'server' => $server->getLogLabel(),
                    'old_health' => $previousHealth->name,
                ]);
            }
        }
    }

    /**
     * Handle the Server "deleting" event.
     */
    public function deleting(Server $server): bool
    {
        // Delete Server, only possible if no meetings from this system are running and the server is disabled
        if ($server->status != ServerStatus::DISABLED || $server->meetings()->whereNull('end')->count() != 0) {
            return false;
        }

        return true;
    }
}
