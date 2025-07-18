<?php

namespace App\Prometheus;

class Histogram
{
    protected \Prometheus\Histogram $resolvedHistogram;

    protected function __construct(protected string $name) {}

    protected function getHistogram(): \Prometheus\Histogram
    {
        if (! isset($this->resolvedHistogram)) {
            $registry = app()->make(CollectorRegistry::class);
            $this->resolvedHistogram = $registry->getHistogram(config('metrics.namespace'), $this->name);
        }

        return $this->resolvedHistogram;
    }

    public static function register(CollectorRegistry $registry, string $name, string $help, array $labels = [], ?array $buckets = null): self
    {
        if (config('metrics.enabled')) {
            $registry->getOrRegisterHistogram(config('metrics.namespace'), $name, $help, $labels, $buckets);
        }

        return new self($name);
    }

    public static function get(string $name): self
    {
        return new self($name);
    }

    public function observe(float $value, array $labels = []): self
    {
        if (! config('metrics.enabled')) {
            return $this;
        }

        $this->getHistogram()->observe($value, $labels);

        return $this;
    }
}
