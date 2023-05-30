<?php

namespace Tests\Unit\Console;

use App\Services\LocaleService;
use Cache;
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
        config([
            'app.enabled_locales'   => ['de', 'en'],
        ]);

        $mock = $this->partialMock(LocaleService::class, function (MockInterface $mock) {
            $mock->shouldReceive('buildJsonLocale')
            ->once()
            ->with('de')
            ->andReturn("{ 'key1': 'value1' }");

            $mock->shouldReceive('buildJsonLocale')
            ->once()
            ->with('en')
            ->andReturn("{ 'key2': 'value2' }");
        });

        $this->instance(
            LocaleService::class,
            $mock
        );

        Cache::shouldReceive('forever')
            ->once()
            ->with('locale-de', "{ 'key1': 'value1' }");

        Cache::shouldReceive('forever')
            ->once()
            ->with('locale-en', "{ 'key2': 'value2' }");

        $this->artisan('locales:cache')
        ->expectsOutput('Locales [ de, en ] cached successfully');
    }
}
