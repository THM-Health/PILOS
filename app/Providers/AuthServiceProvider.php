<?php

namespace App\Providers;

use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\Server;
use App\Models\User;
use App\Policies\RolePolicy;
use App\Policies\RoomPolicy;
use App\Policies\RoomTypePolicy;
use App\Policies\ServerPolicy;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array
     */
    protected $policies = [
        // 'App\Model' => 'App\Policies\ModelPolicy',
        Role::class     => RolePolicy::class,
        User::class     => UserPolicy::class,
        Room::class     => RoomPolicy::class,
        RoomType::class => RoomTypePolicy::class,
        Server::class   => ServerPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        // Check permissions of users roles
        Gate::before(function ($user, $ability) {
            if ($user->hasPermission($ability)) {
                return true;
            }
        });
    }
}
