<?php

namespace App\Prometheus\Collectors;

use App\Models\User;
use App\Prometheus\CollectorRegistry;
use App\Prometheus\Gauge;

class UserCollector implements Collector
{
    public function register(CollectorRegistry $registry): void
    {
        Gauge::register($registry, 'users_total', 'Total number of users');
    }

    public function collect(): void
    {
        Gauge::get('users_total')
            ->set(User::count());
    }
}
