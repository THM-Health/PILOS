<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace Tests\Backend\Utils;

use Illuminate\Support\Str;

trait InteractWithMetrics
{
    public function getMetrics(): array
    {
        return collect(Str::of($this->get('metrics')->getContent())
            ->explode("\n")
            ->filter(fn (string $line) => ! Str::startsWith($line, '#') && $line != '')
            ->mapWithKeys(function (string $line) {
                $data = Str::of($line)->explode(' ');

                return [$data[0] => $data[1]];
            }))->all();
    }
}
