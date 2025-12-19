<?php

namespace App\Providers;

use App\Events\RoomEnded;
use App\Events\RoomStarted;
use App\Listeners\ConfigureStreamingOnRoomStart;
use App\Listeners\FailedLoginAttempt;
use App\Listeners\ResetStreamingOnRoomStop;
use App\Models\IncludedPermissionPermission;
use App\Models\PermissionRole;
use App\Models\RoleUser;
use App\Models\Room;
use App\Models\RoomToken;
use App\Models\Server;
use App\Models\ServerPool;
use App\Models\User;
use App\Observers\IncludedPermissionPermissionObserver;
use App\Observers\PermissionRoleObserver;
use App\Observers\RoleUserObserver;
use App\Observers\RoomObserver;
use App\Observers\RoomTokenObserver;
use App\Observers\ServerObserver;
use App\Observers\ServerPoolObserver;
use App\Observers\UserObserver;
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
        IncludedPermissionPermission::observe(IncludedPermissionPermissionObserver::class);
        PermissionRole::observe(PermissionRoleObserver::class);
        RoleUser::observe(RoleUserObserver::class);
        RoomToken::observe(RoomTokenObserver::class);
        ServerPool::observe(ServerPoolObserver::class);
        User::observe(UserObserver::class);
        Server::observe(ServerObserver::class);
        Room::observe(RoomObserver::class);
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
