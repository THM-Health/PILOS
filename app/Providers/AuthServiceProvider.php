<?php

declare(strict_types=1);

namespace App\Providers;

use App\Auth\LDAP\LDAPProvider;
use App\Auth\Local\LocalProvider;
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
use Carbon\CarbonInterval;
use ErrorException;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Laravel\Passport\Passport;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array
     */
    protected $policies = [
        // 'App\Model' => 'App\Policies\ModelPolicy',
        Role::class => RolePolicy::class,
        User::class => UserPolicy::class,
        Room::class => RoomPolicy::class,
        RoomType::class => RoomTypePolicy::class,
        Server::class => ServerPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        // Check permissions of users roles
        Gate::before(function ($user, $ability) {
            if ($user->hasPermission($ability)) {
                return true;
            }
        });

        $this->app->auth->provider('ldap', function ($app, array $config) {
            return new LDAPProvider($app['hash'], $config['model']);
        });

        $this->app->auth->provider('local', function ($app, array $config) {
            return new LocalProvider($app['hash'], $config['model']);
        });

        Gate::define('viewPulse', function (User $user) {
            return $user->can('system.monitor');
        });

        Passport::defaultScopes([
            'user:own:read',
        ]);

        Passport::tokensCan([
            'user:own:read' => __('auth.oauth.scopes.user_own_read'),
            'room:own:read' => __('auth.oauth.scopes.room_own_read'),
            'room:create' => __('auth.oauth.scopes.room_create'),
        ]);

        // Configure authorization view for OAuth authorization code flow
        Passport::authorizationView(function ($parameters) {
            return response()->json([
                'client' => $parameters['client']->name,
                'scopes' => $parameters['scopes'],
                'authToken' => $parameters['authToken'],
            ]);
        });

        Passport::tokensExpireIn(CarbonInterval::seconds(config('passport.token_lifetime')));
        Passport::refreshTokensExpireIn(CarbonInterval::seconds(config('passport.refresh_token_lifetime')));

        $this->validatePassportKeys();
    }

    /**
     * Validates the Passport RSA key configuration when the external API is enabled.
     *
     * Ensures that the required OAuth private and public keys are present and meet
     * the following criteria:
     * - The private key must be set via the OAUTH_PRIVATE_KEY environment variable.
     * - The private key must be a valid RSA key.
     * - The RSA key must be at least 4096 bits in length.
     * - A public key must be derivable from the provided private key.
     *
     * @throws ErrorException If any key validation check fails.
     */
    private function validatePassportKeys()
    {
        // Only check if passport / external API is enabled
        if (config('passport.enabled')) {
            // Ensure the private key environment variable is present
            if (! config('passport.private_key')) {
                throw new ErrorException('OAUTH_PRIVATE_KEY environment variable is not set.');
            }

            $keyDetails = config('passport.private_key_details');

            // Ensure the private key was successfully parsed
            if (! $keyDetails) {
                throw new ErrorException('OAUTH_PRIVATE_KEY environment variable is not a valid private key.');
            }

            // Only RSA keys are supported for OAuth token signing
            if ($keyDetails['type'] !== OPENSSL_KEYTYPE_RSA) {
                throw new ErrorException('OAUTH_PRIVATE_KEY environment variable is not a valid RSA private key.');
            }

            // Check minimum key size of 4096 bits
            if ($keyDetails['bits'] < 4096) {
                throw new ErrorException('OAUTH_PRIVATE_KEY environment variable RSA private key must be at least 4096 bytes.');
            }

            // Verify that a public key was successfully derived from the private key
            if (! config('passport.public_key')) {
                throw new ErrorException('Failed to extract public key from private key. Please check your OAUTH_PRIVATE_KEY environment variable.');
            }
        }
    }
}
