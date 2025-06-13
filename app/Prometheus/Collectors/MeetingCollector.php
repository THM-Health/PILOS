<?php

namespace App\Prometheus\Collectors;

use App\Models\Meeting;
use App\Prometheus\CollectorRegistry;
use App\Prometheus\Gauge;

class MeetingCollector implements Collector
{
    public function register(CollectorRegistry $registry): void
    {
        Gauge::register($registry, 'meetings_total', 'Total number of meetings');
        Gauge::register($registry, 'running_meetings_total', 'Total number of meetings that are currently running');
    }

    public function collect(): void
    {
        Gauge::get('meetings_total')
            ->set(Meeting::count());

        Gauge::get('running_meetings_total')
            ->set(Meeting::whereNull('end')->whereNotNull('start')->count());
    }
}
