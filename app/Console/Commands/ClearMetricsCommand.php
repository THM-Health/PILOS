<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Console\Commands;

use App\Prometheus\CollectorRegistry;
use Illuminate\Console\Command;

class ClearMetricsCommand extends Command
{
    protected $signature = 'metrics:clear';

    protected $description = 'Clear metric data';

    public function handle(CollectorRegistry $registry): void
    {
        $registry->wipeStorage();
        $this->info('Metrics cleared successfully.');
    }
}
