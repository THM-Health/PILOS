<?php

declare(strict_types=1);

namespace App\Prometheus\Collectors;

use App\Prometheus\CollectorRegistry;

interface Collector
{
    public function register(CollectorRegistry $registry): void;

    public function collect(): void;
}
