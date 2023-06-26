<?php

namespace Tests\Unit\Console;

use App\Services\LocaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Mockery\MockInterface;
use Tests\TestCase;

class LocalesCacheTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * Test if locales cache is build correctly
     */
    public function testLocalesCache()
    {
        $mock = $this->partialMock(LocaleService::class, function (MockInterface $mock) {
            $mock->shouldReceive('buildCache')
            ->once()
            ->with()
            ->andReturn(['de', 'en']);
        });

        $this->instance(
            LocaleService::class,
            $mock
        );

        $this->artisan('locales:cache')
        ->expectsOutput('Locales [ de, en ] cached successfully');
    }
}
