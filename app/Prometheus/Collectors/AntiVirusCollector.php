<?php

declare(strict_types=1);

namespace App\Prometheus\Collectors;

use App\Prometheus\CollectorRegistry;
use App\Prometheus\Counter;

class AntiVirusCollector implements Collector
{
    public function register(CollectorRegistry $registry): void
    {
        Counter::register($registry, 'virus_scan_total', 'Total number of files scanned for viruses', ['result']);
    }

    public function collect(): void
    {
        Counter::get('virus_scan_total')
            ->init(['clean', 'virus', 'error']);
    }
}
