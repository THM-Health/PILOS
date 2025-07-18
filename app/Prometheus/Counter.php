<?php

namespace App\Prometheus;

class Counter
{
    protected \Prometheus\Counter $resolvedCounter;

    protected function __construct(protected string $name) {}

    protected function getCounter(): \Prometheus\Counter
    {
        if (! isset($this->resolvedCounter)) {
            $registry = app()->make(CollectorRegistry::class);
            $this->resolvedCounter = $registry->getCounter(config('metrics.namespace'), $this->name);
        }

        return $this->resolvedCounter;
    }

    public static function register(CollectorRegistry $registry, string $name, string $help, array $labels = []): self
    {
        if (config('metrics.enabled')) {
            $registry->getOrRegisterCounter(config('metrics.namespace'), $name, $help, $labels);
        }

        return new self($name);
    }

    public static function get(string $name): self
    {
        return new self($name);
    }

    public function init(array $labelList = [[]]): self
    {
        foreach ($labelList as $labels) {
            if (! is_array($labels)) {
                $labels = [$labels];
            }
            $this->incBy(0, $labels);
        }

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

        $this->getCounter()->incBy($value, $labels);

        return $this;
    }
}
