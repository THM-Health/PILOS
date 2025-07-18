<?php

namespace App\Prometheus\Collectors;

use App\Prometheus\CollectorRegistry;
use App\Prometheus\Gauge;
use Laravel\Horizon\Contracts\JobRepository;
use Laravel\Horizon\Contracts\MasterSupervisorRepository;
use Laravel\Horizon\Contracts\MetricsRepository;
use Laravel\Horizon\Contracts\WorkloadRepository;

class HorizonCollector implements Collector
{
    protected const int INACTIVE = -1;

    protected const int PAUSED = 0;

    protected const int RUNNING = 1;

    public function register(CollectorRegistry $registry): void
    {
        Gauge::register($registry, 'horizon_master_supervisors', 'Number of master supervisors');
        Gauge::register($registry, 'horizon_current_processes', 'Current processes of all queues', ['queue']);
        Gauge::register($registry, 'horizon_current_workload', 'Current workload of all queues', ['queue']);
        Gauge::register($registry, 'horizon_failed_jobs_per_hour', 'The number of recently failed jobs');
        Gauge::register($registry, 'horizon_status', 'The status of Horizon, -1 = inactive, 0 = paused, 1 = running');
        Gauge::register($registry, 'horizon_jobs_per_minute', 'The number of jobs per minute');
        Gauge::register($registry, 'horizon_recent_jobs', 'The number of recent jobs');
    }

    public function collect(): void
    {
        Gauge::get('horizon_master_supervisors')
            ->set(count(app(MasterSupervisorRepository::class)->all()));

        $currentProcesses = Gauge::get('horizon_current_processes');
        collect(app(WorkloadRepository::class)->get())
            ->sortBy('name')
            ->values()
            ->each(fn (array $workload) => $currentProcesses->set($workload['processes'], [$workload['name']]));

        $currentWorkload = Gauge::get('horizon_current_workload');
        collect(app(WorkloadRepository::class)->get())
            ->sortBy('name')
            ->values()
            ->each(fn (array $workload) => $currentWorkload->set($workload['length'], [$workload['name']]));

        Gauge::get('horizon_failed_jobs_per_hour')
            ->set(app(JobRepository::class)->countRecentlyFailed());

        Gauge::get('horizon_status')
            ->set($this->getHorizonStatus());

        Gauge::get('horizon_jobs_per_minute')
            ->set(app(MetricsRepository::class)->jobsProcessedPerMinute());

        Gauge::get('horizon_recent_jobs')
            ->set(app(JobRepository::class)->countRecent());
    }

    private function getHorizonStatus(): int
    {
        if (! $masters = app(MasterSupervisorRepository::class)->all()) {
            return self::INACTIVE;
        }

        $isPaused = collect($masters)
            ->contains(fn ($master) => $master->status === 'paused');

        return $isPaused
            ? self::PAUSED
            : self::RUNNING;
    }
}
