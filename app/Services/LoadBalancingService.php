<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ServerStatus;
use App\Models\Server;
use App\Models\ServerPool;
use Illuminate\Database\Eloquent\Builder;

class LoadBalancingService
{
    private ServerPool $serverPool;

    public function setServerPool(ServerPool $serverPool)
    {
        $this->serverPool = $serverPool;

        return $this;
    }

    /**
     * Find server in the pool with the lowest usage
     *
     * If multiple servers have the same lowest usage, a pseudo-random server is picked
     */
    public function getLowestUsageServer(): ?Server
    {
        $servers = $this->serverPool->servers()->where('status', ServerStatus::ENABLED)
            ->where(function (Builder $query) {
                $query->where('recover_count', '>=', config('bigbluebutton.server_online_threshold'))
                    ->where('error_count', '=', 0)
                    ->orWhere('connection_status_always_online', true);
            })
            ->whereNotNull('load')
            ->where('strength', '>', 0) // Extra safety against division by zero; request validation ensures strength is between 1 and 10
            ->get();

        // No servers available
        if ($servers->count() == 0) {
            return null;
        }

        // Find all servers with the same lowest usage
        $minUsage = null;
        $minUsageServers = [];

        foreach ($servers as $server) {
            $usage = $server->load / $server->strength;
            if ($minUsage === null || $usage < $minUsage) {
                $minUsage = $usage;
                $minUsageServers = [$server];
            } elseif ($usage == $minUsage) {
                $minUsageServers[] = $server;
            }
        }

        // Use pseudo-random (not security relevant and enables reliable testing with seeding)
        $randomKey = rand(0, count($minUsageServers) - 1);

        return $minUsageServers[$randomKey];
    }
}
