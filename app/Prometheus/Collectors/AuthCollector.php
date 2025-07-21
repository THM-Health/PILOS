<?php

namespace App\Prometheus\Collectors;

use App\Prometheus\CollectorRegistry;
use App\Prometheus\Counter;

class AuthCollector implements Collector
{
    public function register(CollectorRegistry $registry): void
    {
        Counter::register($registry, 'login_failed_total', 'Total number of failed login attempts', ['provider']);
        Counter::register($registry, 'login_total', 'Total number of successful login attempts', ['provider']);
    }

    public function collect(): void
    {
        Counter::get('login_failed_total')
            ->init(['local', 'ldap', 'shibboleth']);
        Counter::get('login_total')
            ->init(['local', 'ldap', 'shibboleth']);

    }
}
