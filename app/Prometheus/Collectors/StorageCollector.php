<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Prometheus\Collectors;

use App\Prometheus\CollectorRegistry;
use App\Prometheus\Gauge;
use Illuminate\Support\Facades\Storage;

class StorageCollector implements Collector
{
    public function register(CollectorRegistry $registry): void
    {
        Gauge::register($registry, 'storage_total_bytes', 'Total storage space in bytes', ['disk']);
        Gauge::register($registry, 'storage_free_bytes', 'Free storage space in bytes', ['disk']);
    }

    public function collect(): void
    {
        if (config('metrics.collectors.storage.enabled')) {
            $storageTotalGauge = Gauge::get('storage_total_bytes');
            $storageFreeGauge = Gauge::get('storage_free_bytes');

            foreach (config('metrics.collectors.storage.disk_names') as $diskName) {
                $storageTotalGauge
                    ->set(disk_total_space(Storage::disk($diskName)->path('')), $diskName);
                $storageFreeGauge
                    ->set(disk_free_space(Storage::disk($diskName)->path('')), $diskName);
            }
        }

    }
}
