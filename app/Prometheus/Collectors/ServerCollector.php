<?php

namespace App\Prometheus\Collectors;

use App\Enums\ServerStatus;
use App\Models\Server;
use App\Prometheus\CollectorRegistry;
use App\Prometheus\Gauge;

class ServerCollector implements Collector
{
    public function register(CollectorRegistry $registry): void
    {
        Gauge::register($registry, 'servers_total', 'Total number of servers', ['status']);
    }

    public function collect(): void
    {
        Gauge::get('servers_total')
            ->set(Server::where('status', ServerStatus::DISABLED)->count(), ['disabled'])
            ->set(Server::where('status', ServerStatus::DRAINING)->count(), ['draining'])
            ->set(Server::where('status', ServerStatus::ENABLED)
                ->where('recover_count', '>=', config('bigbluebutton.server_online_threshold'))
                ->count(), ['online'])
            ->set(Server::where('status', ServerStatus::ENABLED)
                ->where('error_count', '>=', config('bigbluebutton.server_offline_threshold'))
                ->count(), ['offline'])
            ->set(Server::where('status', ServerStatus::ENABLED)
                ->where('recover_count', '<', config('bigbluebutton.server_online_threshold'))
                ->where('error_count', '<', config('bigbluebutton.server_offline_threshold'))
                ->count(), ['unhealthy']);
    }
}
