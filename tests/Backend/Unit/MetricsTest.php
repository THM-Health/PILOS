<?php

namespace Tests\Backend\Unit;

use App\Prometheus\CollectorRegistry;
use App\Prometheus\Counter;
use App\Prometheus\Gauge;
use App\Prometheus\Histogram;
use App\Prometheus\Summary;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\ParallelTesting;
use Tests\Backend\TestCase;

class MetricsTest extends TestCase
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

    public function test_counter()
    {
        $registry = $this->app->make(CollectorRegistry::class);
        Counter::register($registry, 'test_counter', 'Test counter');

        Counter::get('test_counter')->incBy(5);
        Counter::get('test_counter')->incBy(5);

        $metricSamples = $registry->getMetricFamilySamples();
        $this->assertCount(1, $metricSamples);
        $this->assertEquals('pilos_test_counter', $metricSamples[0]->getName());
        $this->assertEquals('Test counter', $metricSamples[0]->getHelp());
        $this->assertEquals('counter', $metricSamples[0]->getType());
        $this->assertCount(1, $metricSamples[0]->getSamples());
        $this->assertEquals(10, $metricSamples[0]->getSamples()[0]->getValue());
    }

    public function test_counter_with_labels()
    {
        $registry = $this->app->make(CollectorRegistry::class);
        Counter::register($registry, 'test_counter', 'Test counter', ['kind']);

        Counter::get('test_counter')->inc('A');
        Counter::get('test_counter')->inc(['A']);
        Counter::get('test_counter')->incBy(5, 'B');
        Counter::get('test_counter')->incBy(5, ['B']);

        $metricSamples = $registry->getMetricFamilySamples();
        $this->assertCount(1, $metricSamples);
        $this->assertEquals('pilos_test_counter', $metricSamples[0]->getName());
        $this->assertEquals('Test counter', $metricSamples[0]->getHelp());
        $this->assertCount(1, $metricSamples[0]->getLabelNames());
        $this->assertEquals('kind', $metricSamples[0]->getLabelNames()[0]);
        $this->assertEquals('counter', $metricSamples[0]->getType());
        $this->assertCount(2, $metricSamples[0]->getSamples());

        $this->assertEquals(2, $metricSamples[0]->getSamples()[0]->getValue());
        $this->assertEquals('A', $metricSamples[0]->getSamples()[0]->getLabelValues()[0]);

        $this->assertEquals(10, $metricSamples[0]->getSamples()[1]->getValue());
        $this->assertEquals('B', $metricSamples[0]->getSamples()[1]->getLabelValues()[0]);
    }

    public function test_counter_disabled()
    {
        $registry = $this->app->make(CollectorRegistry::class);

        // Register doesn't throw an error if called when metrics are disabled
        config(['metrics.enabled' => false]);
        Counter::register($registry, 'test_counter', 'Test counter');

        // Changing counter-value when metrics are disabled should have no effect
        // and not throw an error
        Counter::get('test_counter')->inc();
        Counter::get('test_counter')->incBy(5);

        // Enable metrics again and check that no samples were recorded
        config(['metrics.enabled' => true]);
        $metricSamples = $registry->getMetricFamilySamples();
        $this->assertCount(0, $metricSamples);
    }

    public function test_gauge()
    {
        $registry = $this->app->make(CollectorRegistry::class);
        Gauge::register($registry, 'test_gauge', 'Test gauge');

        $gauge = Gauge::get('test_gauge');
        $gauge->set(3);
        $gauge->inc();
        $gauge->incBy(3);
        $gauge->dec();
        $gauge->decBy(2);

        $metricSamples = $registry->getMetricFamilySamples();
        $this->assertCount(1, $metricSamples);
        $this->assertEquals('pilos_test_gauge', $metricSamples[0]->getName());
        $this->assertEquals('gauge', $metricSamples[0]->getType());
        $this->assertEquals(4, $metricSamples[0]->getSamples()[0]->getValue());
    }

    public function test_gauge_with_labels()
    {
        $registry = $this->app->make(CollectorRegistry::class);
        Gauge::register($registry, 'test_gauge', 'Test gauge', ['kind']);

        $gauge = Gauge::get('test_gauge');
        $gauge->set(3, 'A');
        $gauge->inc('A');
        $gauge->incBy(3, 'A');
        $gauge->dec('A');
        $gauge->decBy(2, 'A');

        $gauge->set(4, ['B']);
        $gauge->inc(['B']);
        $gauge->incBy(4, ['B']);
        $gauge->dec(['B']);
        $gauge->decBy(2, ['B']);

        $metricSamples = $registry->getMetricFamilySamples();
        $this->assertCount(1, $metricSamples);
        $this->assertEquals('pilos_test_gauge', $metricSamples[0]->getName());
        $this->assertEquals('gauge', $metricSamples[0]->getType());
        $this->assertEquals('kind', $metricSamples[0]->getLabelNames()[0]);
        $this->assertEquals(4, $metricSamples[0]->getSamples()[0]->getValue());
        $this->assertEquals('A', $metricSamples[0]->getSamples()[0]->getLabelValues()[0]);
        $this->assertEquals(6, $metricSamples[0]->getSamples()[1]->getValue());
        $this->assertEquals('B', $metricSamples[0]->getSamples()[1]->getLabelValues()[0]);
    }

    public function test_gauge_disabled()
    {
        $registry = $this->app->make(CollectorRegistry::class);

        // Register doesn't throw an error if called when metrics are disabled
        config(['metrics.enabled' => false]);
        Gauge::register($registry, 'test_gauge', 'Test gauge');

        // Changing gauge value when metrics are disabled should have no effect
        // and not throw an error
        $gauge = Gauge::get('test_gauge');
        $gauge->set(3);
        $gauge->inc();
        $gauge->incBy(3);
        $gauge->dec();
        $gauge->decBy(2);

        // Enable metrics again and check that no samples were recorded
        config(['metrics.enabled' => true]);
        $metricSamples = $registry->getMetricFamilySamples();
        $this->assertCount(0, $metricSamples);
    }

    public function test_summary()
    {
        $registry = $this->app->make(CollectorRegistry::class);
        Summary::register($registry, 'test_summary', 'Test summary');

        $summary = Summary::get('test_summary');
        $summary->observe(5);
        $summary->observe(10);
        $summary->observe(10);
        $summary->observe(15);

        $metricSamples = $registry->getMetricFamilySamples();
        $this->assertCount(1, $metricSamples);
        $this->assertEquals('pilos_test_summary', $metricSamples[0]->getName());
        $this->assertEquals('summary', $metricSamples[0]->getType());
        $this->assertCount(7, $metricSamples[0]->getSamples());

        // Default quantiles (0.01, 0.05, 0.5, 0.95, 0.99)

        // Quantile 0.01
        $this->assertEquals(5, $metricSamples[0]->getSamples()[0]->getValue());
        $this->assertEquals('pilos_test_summary', $metricSamples[0]->getSamples()[0]->getName());
        $this->assertEquals('0.01', $metricSamples[0]->getSamples()[0]->getLabelValues()[0]);
        $this->assertEquals('quantile', $metricSamples[0]->getSamples()[0]->getLabelNames()[0]);

        // Quantile 0.05
        $this->assertEquals(5, $metricSamples[0]->getSamples()[1]->getValue());
        $this->assertEquals('pilos_test_summary', $metricSamples[0]->getSamples()[1]->getName());
        $this->assertEquals('0.05', $metricSamples[0]->getSamples()[1]->getLabelValues()[0]);
        $this->assertEquals('quantile', $metricSamples[0]->getSamples()[1]->getLabelNames()[0]);

        // Quantile 0.5
        $this->assertEquals(10, $metricSamples[0]->getSamples()[2]->getValue());
        $this->assertEquals('pilos_test_summary', $metricSamples[0]->getSamples()[2]->getName());
        $this->assertEquals('0.5', $metricSamples[0]->getSamples()[2]->getLabelValues()[0]);
        $this->assertEquals('quantile', $metricSamples[0]->getSamples()[2]->getLabelNames()[0]);

        // Quantile 0.95
        $this->assertEquals(15, $metricSamples[0]->getSamples()[3]->getValue());
        $this->assertEquals('pilos_test_summary', $metricSamples[0]->getSamples()[3]->getName());
        $this->assertEquals('0.95', $metricSamples[0]->getSamples()[3]->getLabelValues()[0]);
        $this->assertEquals('quantile', $metricSamples[0]->getSamples()[3]->getLabelNames()[0]);

        // Quantile 0.99
        $this->assertEquals(15, $metricSamples[0]->getSamples()[4]->getValue());
        $this->assertEquals('pilos_test_summary', $metricSamples[0]->getSamples()[4]->getName());
        $this->assertEquals('0.99', $metricSamples[0]->getSamples()[4]->getLabelValues()[0]);
        $this->assertEquals('quantile', $metricSamples[0]->getSamples()[4]->getLabelNames()[0]);

        // Count
        $this->assertEquals(4, $metricSamples[0]->getSamples()[5]->getValue());
        $this->assertEquals('pilos_test_summary_count', $metricSamples[0]->getSamples()[5]->getName());

        // Sum
        $this->assertEquals(40, $metricSamples[0]->getSamples()[6]->getValue());
        $this->assertEquals('pilos_test_summary_sum', $metricSamples[0]->getSamples()[6]->getName());
    }

    public function test_summary_custom_quantiles()
    {
        $registry = $this->app->make(CollectorRegistry::class);
        Summary::register($registry, 'test_summary', 'Test summary', quantiles: [0.25, 0.5, 0.75]);

        $summary = Summary::get('test_summary');
        $summary->observe(1);
        $summary->observe(5);
        $summary->observe(10);
        $summary->observe(10);
        $summary->observe(15);
        $summary->observe(20);

        $metricSamples = $registry->getMetricFamilySamples();
        $this->assertCount(1, $metricSamples);
        $this->assertEquals('pilos_test_summary', $metricSamples[0]->getName());
        $this->assertEquals('summary', $metricSamples[0]->getType());
        $this->assertCount(5, $metricSamples[0]->getSamples());

        // Quantile 0.25
        $this->assertEquals(5, $metricSamples[0]->getSamples()[0]->getValue());
        $this->assertEquals('pilos_test_summary', $metricSamples[0]->getSamples()[0]->getName());
        $this->assertEquals('0.25', $metricSamples[0]->getSamples()[0]->getLabelValues()[0]);
        $this->assertEquals('quantile', $metricSamples[0]->getSamples()[0]->getLabelNames()[0]);

        // Quantile 0.5
        $this->assertEquals(10, $metricSamples[0]->getSamples()[1]->getValue());
        $this->assertEquals('pilos_test_summary', $metricSamples[0]->getSamples()[1]->getName());
        $this->assertEquals('0.5', $metricSamples[0]->getSamples()[1]->getLabelValues()[0]);
        $this->assertEquals('quantile', $metricSamples[0]->getSamples()[1]->getLabelNames()[0]);

        // Quantile 0.75
        $this->assertEquals(15, $metricSamples[0]->getSamples()[2]->getValue());
        $this->assertEquals('pilos_test_summary', $metricSamples[0]->getSamples()[2]->getName());
        $this->assertEquals('0.75', $metricSamples[0]->getSamples()[2]->getLabelValues()[0]);
        $this->assertEquals('quantile', $metricSamples[0]->getSamples()[2]->getLabelNames()[0]);

        // Count
        $this->assertEquals(6, $metricSamples[0]->getSamples()[3]->getValue());
        $this->assertEquals('pilos_test_summary_count', $metricSamples[0]->getSamples()[3]->getName());

        // Sum
        $this->assertEquals(61, $metricSamples[0]->getSamples()[4]->getValue());
        $this->assertEquals('pilos_test_summary_sum', $metricSamples[0]->getSamples()[4]->getName());
    }

    public function test_summary_disabled()
    {
        $registry = $this->app->make(CollectorRegistry::class);

        // Register doesn't throw an error if called when metrics are disabled
        config(['metrics.enabled' => false]);
        Summary::register($registry, 'test_summary', 'Test summary');

        // Adding values when metrics are disabled should have no effect
        // and not throw an error
        $summary = Summary::get('test_summary');
        $summary->observe(5);

        // Enable metrics again and check that no samples were recorded
        config(['metrics.enabled' => true]);
        $metricSamples = $registry->getMetricFamilySamples();
        $this->assertCount(0, $metricSamples);
    }

    public function test_histogram()
    {
        $registry = $this->app->make(CollectorRegistry::class);
        Histogram::register($registry, 'test_histogram', 'Test histogram', buckets: [0.1, 1, 2.5, 5, 10]);

        $histogram = Histogram::get('test_histogram');
        $histogram->observe(0.05);
        $histogram->observe(0.1);
        $histogram->observe(0.5);
        $histogram->observe(2);
        $histogram->observe(7);
        $histogram->observe(12);

        $metricSamples = $registry->getMetricFamilySamples();
        $this->assertCount(1, $metricSamples);
        $this->assertEquals('pilos_test_histogram', $metricSamples[0]->getName());
        $this->assertEquals('histogram', $metricSamples[0]->getType());

        // Bucket 0.1
        $this->assertEquals(2, $metricSamples[0]->getSamples()[0]->getValue());
        $this->assertEquals('pilos_test_histogram_bucket', $metricSamples[0]->getSamples()[0]->getName());
        $this->assertEquals('0.1', $metricSamples[0]->getSamples()[0]->getLabelValues()[0]);
        $this->assertEquals('le', $metricSamples[0]->getSamples()[0]->getLabelNames()[0]);

        // Bucket 1
        $this->assertEquals(3, $metricSamples[0]->getSamples()[1]->getValue());
        $this->assertEquals('pilos_test_histogram_bucket', $metricSamples[0]->getSamples()[1]->getName());
        $this->assertEquals('1', $metricSamples[0]->getSamples()[1]->getLabelValues()[0]);
        $this->assertEquals('le', $metricSamples[0]->getSamples()[1]->getLabelNames()[0]);

        // Bucket 2.5
        $this->assertEquals(4, $metricSamples[0]->getSamples()[2]->getValue());
        $this->assertEquals('pilos_test_histogram_bucket', $metricSamples[0]->getSamples()[2]->getName());
        $this->assertEquals('2.5', $metricSamples[0]->getSamples()[2]->getLabelValues()[0]);
        $this->assertEquals('le', $metricSamples[0]->getSamples()[2]->getLabelNames()[0]);

        // Bucket 5
        $this->assertEquals(4, $metricSamples[0]->getSamples()[3]->getValue());
        $this->assertEquals('pilos_test_histogram_bucket', $metricSamples[0]->getSamples()[3]->getName());
        $this->assertEquals('5', $metricSamples[0]->getSamples()[3]->getLabelValues()[0]);
        $this->assertEquals('le', $metricSamples[0]->getSamples()[3]->getLabelNames()[0]);

        // Bucket 10
        $this->assertEquals(5, $metricSamples[0]->getSamples()[4]->getValue());
        $this->assertEquals('pilos_test_histogram_bucket', $metricSamples[0]->getSamples()[4]->getName());
        $this->assertEquals('10', $metricSamples[0]->getSamples()[4]->getLabelValues()[0]);
        $this->assertEquals('le', $metricSamples[0]->getSamples()[4]->getLabelNames()[0]);

        // Bucket +Inf
        $this->assertEquals(6, $metricSamples[0]->getSamples()[5]->getValue());
        $this->assertEquals('pilos_test_histogram_bucket', $metricSamples[0]->getSamples()[5]->getName());
        $this->assertEquals('+Inf', $metricSamples[0]->getSamples()[5]->getLabelValues()[0]);
        $this->assertEquals('le', $metricSamples[0]->getSamples()[5]->getLabelNames()[0]);

        // Count
        $this->assertEquals(6, $metricSamples[0]->getSamples()[6]->getValue());
        $this->assertEquals('pilos_test_histogram_count', $metricSamples[0]->getSamples()[6]->getName());

        // Sum
        $this->assertEquals(21.65, $metricSamples[0]->getSamples()[7]->getValue());
        $this->assertEquals('pilos_test_histogram_sum', $metricSamples[0]->getSamples()[7]->getName());
    }

    public function test_histogram_disabled()
    {
        $registry = $this->app->make(CollectorRegistry::class);

        // Register doesn't throw an error if called when metrics are disabled
        config(['metrics.enabled' => false]);
        Histogram::register($registry, 'test_histogram', 'Test histogram', buckets: [0.1, 1, 2.5, 5, 10]);

        // Adding values when metrics are disabled should have no effect
        // and not throw an error
        $histogram = Histogram::get('test_histogram');
        $histogram->observe(0.05);

        // Enable metrics again and check that no samples were recorded
        config(['metrics.enabled' => true]);
        $metricSamples = $registry->getMetricFamilySamples();
        $this->assertCount(0, $metricSamples);
    }
}
