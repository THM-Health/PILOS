<?php

namespace App\Prometheus;

class Gauge
{
    protected \Prometheus\Gauge $resolvedGauge;

    protected function __construct(protected string $name) {}

    protected function getGauge(): \Prometheus\Gauge
    {
        if (! isset($this->resolvedGauge)) {
            $registry = app()->make(CollectorRegistry::class);
            $this->resolvedGauge = $registry->getGauge(config('metrics.namespace'), $this->name);
        }

        return $this->resolvedGauge;
    }

    public static function register(CollectorRegistry $registry, string $name, string $help, array $labels = []): self
    {
        if (config('metrics.enabled')) {
            $registry->getOrRegisterGauge(config('metrics.namespace'), $name, $help, $labels);
        }

        return new self($name);
    }

    public static function get(string $name): self
    {
        return new self($name);
    }

    public function set(float $value, string|array $labels = []): self
    {
        if (! config('metrics.enabled')) {
            return $this;
        }

        if (! is_array($labels)) {
            $labels = [$labels];
        }

        $this->getGauge()->set($value, $labels);

        return $this;
    }

    public function inc(string|array $labels = []): self
    {
        return $this->incBy(1, $labels);
    }

    public function incBy(float $value, string|array $labels = []): self
    {
        if (! config('metrics.enabled')) {
            return $this;
        }

        if (! is_array($labels)) {
            $labels = [$labels];
        }

        $this->getGauge()->incBy($value, $labels);

        return $this;
    }

    public function dec(string|array $labels = []): self
    {
        return $this->decBy(1, $labels);
    }

    public function decBy(float $value, string|array $labels = []): self
    {
        if (! config('metrics.enabled')) {
            return $this;
        }

        if (! is_array($labels)) {
            $labels = [$labels];
        }

        $this->getGauge()->decBy($value, $labels);

        return $this;
    }
}
