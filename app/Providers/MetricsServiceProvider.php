<?php

namespace App\Providers;

use App\Prometheus\CollectorRegistry;
use App\Prometheus\Collectors\AuthCollector;
use App\Prometheus\Collectors\FileCollector;
use App\Prometheus\Collectors\HorizonCollector;
use App\Prometheus\Collectors\MeetingCollector;
use App\Prometheus\Collectors\RecordingCollector;
use App\Prometheus\Collectors\RequestCollector;
use App\Prometheus\Collectors\RoomCollector;
use App\Prometheus\Collectors\ServerCollector;
use App\Prometheus\Collectors\SessionCollector;
use App\Prometheus\Collectors\UserCollector;
use Illuminate\Contracts\Support\DeferrableProvider;
use Illuminate\Foundation\Application;
use Illuminate\Support\ServiceProvider;
use Prometheus\Storage\Redis;

class MetricsServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public static array $collectors = [
        ServerCollector::class,
        UserCollector::class,
        RoomCollector::class,
        MeetingCollector::class,
        RecordingCollector::class,
        FileCollector::class,
        SessionCollector::class,
        HorizonCollector::class,
        AuthCollector::class,
        RequestCollector::class,
    ];

    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(CollectorRegistry::class, function (Application $app) {
            Redis::setPrefix(config('metrics.redis.prefix'));
            $registry = new CollectorRegistry(Redis::fromExistingConnection(\Illuminate\Support\Facades\Redis::client()), self::$collectors);

            if (config('metrics.enabled')) {
                $registry->registerCollectors();
            }

            return $registry;
        });
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array<int, string>
     */
    public function provides(): array
    {
        return [CollectorRegistry::class];
    }
}
