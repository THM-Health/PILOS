<?php

namespace App\Prometheus\Collectors;

use App\Prometheus\CollectorRegistry;
use App\Prometheus\Counter;
use App\Prometheus\Summary;

class RequestCollector implements Collector
{
    public function register(CollectorRegistry $registry): void
    {
        Summary::register($registry, 'request_duration_seconds', 'Duration of a request', [], 60);
        Counter::register($registry, 'request_total', 'Total number of requests', ['code']);
        Summary::register($registry, 'request_memory_bytes', 'Memory usage during a request', [], 60);
    }

    public function collect(): void
    {
        Counter::get('request_total')
            ->init(['1xx', '2xx', '3xx', '4xx', '5xx']);
    }
}
