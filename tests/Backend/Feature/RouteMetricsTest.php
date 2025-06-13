<?php

namespace Tests\Backend\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\ParallelTesting;
use Illuminate\Support\Str;
use Tests\Backend\TestCase;

class RouteMetricsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        putenv('DISABLE_CATCHALL_ROUTES=true');

        parent::setUp();

        $token = ParallelTesting::token();
        $prefix = 'TESTING_'.($token ? $token.'_' : '').config('metrics.redis.prefix');
        config(['metrics.enabled' => true]);
        config(['metrics.redis.prefix' => $prefix]);
        $registry = $this->app->make(\App\Prometheus\CollectorRegistry::class);
        $registry->wipeStorage();

        \Route::get('test/{code}', [
            'as' => 'test',
            function (int $code = 200) {
                return response('test', $code);
            },
        ]);
    }

    protected function tearDown(): void
    {
        putenv('DISABLE_CATCHALL_ROUTES');
        parent::tearDown();
    }

    private function getMetrics(): array
    {
        return collect(Str::of($this->get('metrics')->getContent())
            ->explode("\n")
            ->filter(fn (string $line) => ! Str::startsWith($line, '#') && $line != '')
            ->mapWithKeys(function (string $line) {
                $data = Str::of($line)->explode(' ');

                return [$data[0] => $data[1]];
            }))->all();
    }

    public function test_route_metrics_request_total()
    {
        config(['metrics.collectors.request_duration_seconds.enabled' => false]);
        config(['metrics.collectors.request_memory_bytes.enabled' => false]);
        config(['metrics.collectors.request_total.enabled' => true]);

        // Call the route
        $this->get(route('test', ['code' => 200]));
        $this->get(route('test', ['code' => 201]));
        $this->get(route('test', ['code' => 204]));
        $this->get(route('test', ['code' => 302]));
        $this->get(route('test', ['code' => 400]));
        $this->get(route('test', ['code' => 401]));
        $this->get(route('test', ['code' => 404]));
        $this->get(route('test', ['code' => 424]));
        $this->get(route('test', ['code' => 500]));
        $this->get(route('test', ['code' => 501]));

        $metrics = $this->getMetrics();
        $this->assertEquals(0, $metrics['pilos_request_total{code="1xx"}']);
        $this->assertEquals(3, $metrics['pilos_request_total{code="2xx"}']);
        $this->assertEquals(1, $metrics['pilos_request_total{code="3xx"}']);
        $this->assertEquals(4, $metrics['pilos_request_total{code="4xx"}']);
        $this->assertEquals(2, $metrics['pilos_request_total{code="5xx"}']);
    }

    public function test_route_metrics_request_duration()
    {
        config(['metrics.collectors.request_duration_seconds.enabled' => true]);
        config(['metrics.collectors.request_memory_bytes.enabled' => false]);
        config(['metrics.collectors.request_total.enabled' => false]);

        // Call the route
        $this->get(route('test', ['code' => 200]));
        $this->get(route('test', ['code' => 200]));

        $metrics = $this->getMetrics();
        $this->assertEquals(2, $metrics['pilos_request_duration_seconds_count']);
    }

    public function test_route_metrics_request_memory()
    {
        config(['metrics.collectors.request_duration_seconds.enabled' => false]);
        config(['metrics.collectors.request_memory_bytes.enabled' => true]);
        config(['metrics.collectors.request_total.enabled' => false]);

        // Call the route
        $this->get(route('test', ['code' => 200]));
        $this->get(route('test', ['code' => 200]));

        $metrics = $this->getMetrics();
        $this->assertEquals(2, $metrics['pilos_request_memory_bytes_count']);
    }
}
