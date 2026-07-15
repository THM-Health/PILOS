<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ServerStatus;
use App\Models\Server;
use App\Models\ServerPool;

class LoadBalancingService
{
    private $servers;

    private $backupServers;

    public function setServerPool(ServerPool $serverPool)
    {
        $this->servers = $serverPool->servers;
        $this->backupServers = $serverPool->backupServers;

        return $this;
    }

    /**
     * Find server in the pool with the lowest usage
     *
     * @return array{server:? Server, isPrefered:bool}
     */
    public function getLowestUsageServer(): array
    {
        $preferredServer = $this->servers
            ->where('status', ServerStatus::ENABLED)
            ->where('recover_count', '>=', config('bigbluebutton.server_online_threshold'))
            ->where('error_count', '=', 0)
            ->whereNotNull('load')
            ->sortBy(function (Server $server) {
                return $server->load / $server->strength;
            })
            ->first();

        // Check if the preferred server is available
        if ($preferredServer) {
            return ['server' => $preferredServer, 'isPreferred' => true];
        }

        // If no server is found, check backup servers
        $backupServer = $this->backupServers
            ->where('status', ServerStatus::ENABLED)
            ->where('recover_count', '>=', config('bigbluebutton.server_online_threshold'))
            ->where('error_count', '=', 0)
            ->whereNotNull('load')
            ->sortBy(function (Server $server) {
                return $server->load / $server->strength;
            })
            ->first();

        return ['server' => $backupServer, 'isPreferred' => false];
    }
}
