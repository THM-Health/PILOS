<?php

namespace App\Providers;

use App\Events\RoomEnded;
use App\Events\RoomStarted;
use App\Listeners\ConfigureStreamingOnRoomStart;
use App\Listeners\FailedLoginAttempt;
use App\Listeners\ResetStreamingOnRoomStop;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
        Failed::class => [
            FailedLoginAttempt::class,
        ],
        RoomStarted::class => [
            ConfigureStreamingOnRoomStart::class,
        ],
        RoomEnded::class => [
            ResetStreamingOnRoomStop::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
