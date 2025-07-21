<?php

namespace App\Prometheus\Collectors;

use App\Models\Session;
use App\Prometheus\CollectorRegistry;
use App\Prometheus\Gauge;

class SessionCollector implements Collector
{
    public function register(CollectorRegistry $registry): void
    {
        Gauge::register($registry, 'active_sessions_total', 'Total number of active sessions / logged in users');
    }

    public function collect(): void
    {
        Gauge::get('active_sessions_total')
            ->set(Session::whereNotNull('user_id')->count());
    }
}
