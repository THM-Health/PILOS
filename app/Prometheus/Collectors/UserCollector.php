<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Prometheus\Collectors;

use App\Models\User;
use App\Prometheus\CollectorRegistry;
use App\Prometheus\Gauge;

class UserCollector implements Collector
{
    public function register(CollectorRegistry $registry): void
    {
        Gauge::register($registry, 'users_total', 'Total number of users');
    }

    public function collect(): void
    {
        Gauge::get('users_total')
            ->set(User::count());
    }
}
