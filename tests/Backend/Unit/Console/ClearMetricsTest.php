<?php

namespace Tests\Backend\Unit\Console;

use App\Prometheus\CollectorRegistry;
use App\Prometheus\Counter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\ParallelTesting;
use Tests\Backend\TestCase;

class ClearMetricsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $token = ParallelTesting::token();
        $prefix = 'TESTING_'.($token ? $token.'_' : '').config('metrics.redis.prefix');
        config(['metrics.enabled' => true]);
        config(['metrics.namespace' => 'pilos']);
        config(['metrics.redis.prefix' => $prefix]);
        $registry = $this->app->make(CollectorRegistry::class);
        $registry->wipeStorage();
    }

    public function test_clean_metrics()
    {
        $registry = $this->app->make(CollectorRegistry::class);
        Counter::register($registry, 'test_counter', 'Test counter');

        Counter::get('test_counter')->incBy(10);

        $metricSamples = $registry->getMetricFamilySamples();
        $this->assertCount(1, $metricSamples);
        $this->assertEquals('pilos_test_counter', $metricSamples[0]->getName());
        $this->assertEquals('Test counter', $metricSamples[0]->getHelp());
        $this->assertEquals('counter', $metricSamples[0]->getType());
        $this->assertCount(1, $metricSamples[0]->getSamples());
        $this->assertEquals(10, $metricSamples[0]->getSamples()[0]->getValue());

        // Clean up metrics
        $this->artisan('metrics:clear')
            ->expectsOutput('Metrics cleared successfully.')
            ->assertExitCode(0);

        $metricSamples = $registry->getMetricFamilySamples();
        $this->assertCount(0, $metricSamples);
    }
}
