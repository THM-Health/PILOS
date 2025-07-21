<?php

namespace App\Prometheus\Collectors;

use App\Models\Recording;
use App\Prometheus\CollectorRegistry;
use App\Prometheus\Gauge;

class RecordingCollector implements Collector
{
    public function register(CollectorRegistry $registry): void
    {
        Gauge::register($registry, 'recordings_total', 'Total number of recordings');
    }

    public function collect(): void
    {
        Gauge::get('recordings_total')
            ->set(Recording::count());
    }
}
