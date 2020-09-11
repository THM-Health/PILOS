<?php

namespace App\Providers;

use App\Invitation;
use App\Policies\InvitationPolicy;
use App\Policies\RoomPolicy;
use App\Policies\UserPolicy;
use App\Room;
use App\User;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array
     */
    protected $policies = [
        // 'App\Model' => 'App\Policies\ModelPolicy',
        Room::class       => RoomPolicy::class,
        User::class       => UserPolicy::class,
        Invitation::class => InvitationPolicy::class
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
