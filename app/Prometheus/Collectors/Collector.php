<?php

namespace App\Prometheus\Collectors;

use App\Prometheus\CollectorRegistry;

interface Collector
{
    public function register(CollectorRegistry $registry): void;

    public function collect(): void;
}
