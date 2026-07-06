<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Prometheus;

use Prometheus\CollectorRegistry as BaseCollectorRegistry;
use Prometheus\Storage\Adapter;

class CollectorRegistry extends BaseCollectorRegistry
{
    public function __construct(Adapter $storageAdapter, private readonly array $collectors)
    {
        parent::__construct($storageAdapter, false);
    }

    public function registerCollectors(): void
    {
        foreach ($this->collectors as $collector) {
            (new $collector)->register($this);
        }
    }
}
