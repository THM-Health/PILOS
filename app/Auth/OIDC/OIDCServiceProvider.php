<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Auth\OIDC;

use Illuminate\Contracts\Support\DeferrableProvider;
use Illuminate\Foundation\Application;
use Illuminate\Support\ServiceProvider;

class OIDCServiceProvider extends ServiceProvider implements DeferrableProvider
{
    /**
     * Register the OpenID Connect provider.
     */
    public function register(): void
    {
        $this->app->singleton(OIDCProvider::class, function (Application $app) {
            $oidc = new OpenIDConnectClient(
                config('services.oidc.issuer'),
                config('services.oidc.client_id'),
                config('services.oidc.client_secret'),
                route('auth.oidc.callback'),
            );

            $oidc->addScope(config('services.oidc.scopes'));
            $oidc->setLeeway(config('services.oidc.leeway'));
            $oidc->setTimeout(config('services.oidc.timeout'));
            $oidc->setCacheConfigMaxAge(config('services.oidc.cache_config_max_age'));
            $oidc->setCacheJwksMaxAge(config('services.oidc.cache_jwks_max_age'));

            // Disable peer verification in only allowed in a local environment
            if (! config('services.oidc.verify_peer') && $app->isLocal()) {
                $oidc->setVerifyPeer(false);
            }

            return new OIDCProvider($oidc);
        });
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array<int, string>
     */
    public function provides(): array
    {
        return [OIDCProvider::class];
    }
}
