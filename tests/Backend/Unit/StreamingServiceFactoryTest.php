<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace Tests\Backend\Unit;

use App\Models\Meeting;
use App\Services\StreamingService;
use App\Services\StreamingServiceFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Backend\TestCase;

class StreamingServiceFactoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_make()
    {
        $meeting = Meeting::factory()->create();

        $factory = app(StreamingServiceFactory::class)::make($meeting);

        $this->assertEquals($factory::class, StreamingService::class);
        $this->assertTrue($factory->meeting->is($meeting));
    }
}
