<?php

namespace App\Services;

use App\Enums\ServerStatus;
use App\Models\Server;
use App\Models\ServerPool;

class LoadBalancingService
{
    private $servers;

    private int $participantWeight = 1;

    private int $audioWeight = 2;

    private int $videoWeight = 3;

    public function setServerPool(ServerPool $serverPool)
    {
        $this->servers = $serverPool->servers;

        return $this;
    }

    /**
     * Find server in the pool with the lowest usage
     */
    public function getLowestUsageServer(): ?Server
    {
        return $this->servers
            ->where('status', ServerStatus::ENABLED)
            ->where('recover_count', '>=', config('bigbluebutton.server_healthy_threshold'))
            ->where('error_count', '=', 0)
            ->whereNotNull('load')
            ->sortBy(function (Server $server) {
                return $server->load / $server->strength;
            })
            ->first();
    }
}
