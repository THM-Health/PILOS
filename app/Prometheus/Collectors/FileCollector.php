<?php

namespace App\Prometheus\Collectors;

use App\Models\RoomFile;
use App\Prometheus\CollectorRegistry;
use App\Prometheus\Gauge;

class FileCollector implements Collector
{
    public function register(CollectorRegistry $registry): void
    {
        Gauge::register($registry, 'files_total', 'Total number of files');
    }

    public function collect(): void
    {
        Gauge::get('files_total')
            ->set(RoomFile::count());
    }
}
