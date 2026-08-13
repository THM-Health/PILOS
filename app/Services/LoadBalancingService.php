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
     */
    public function getLowestUsageServer(): ?Server
    {
        return $this->serverPool->servers()
            ->where('status', ServerStatus::ENABLED)
            ->where(function (Builder $query) {
                $query->where('recover_count', '>=', config('bigbluebutton.server_online_threshold'))
                    ->where('error_count', '=', 0)
                    ->orWhere('connection_status_always_online', true);
            })
            ->whereNotNull('load')
            ->where('strength', '>', 0) // Extra safety against division by zero; request validation ensures strength is between 1 and 10
            ->orderByRaw('`load` / `strength`')
            ->first();
    }
}
