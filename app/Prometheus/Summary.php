<?php

namespace App\Prometheus;

class Summary
{
    protected \Prometheus\Summary $resolvedSummary;

    protected function __construct(protected string $name) {}

    protected function getSummary(): \Prometheus\Summary
    {
        if (! isset($this->resolvedSummary)) {
            $registry = app()->make(CollectorRegistry::class);
            $this->resolvedSummary = $registry->getSummary(config('metrics.namespace'), $this->name);
        }

        return $this->resolvedSummary;
    }

    public static function register(CollectorRegistry $registry, string $name, string $help, array $labels = [], int $maxAgeSeconds = 600, ?array $quantiles = null): self
    {
        if (config('metrics.enabled')) {
            $registry->getOrRegisterSummary(config('metrics.namespace'), $name, $help, $labels, $maxAgeSeconds, $quantiles);
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

        $this->getSummary()->observe($value, $labels);

        return $this;
    }
}
