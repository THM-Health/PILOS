<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Auth\OIDC;

use App\Auth\MissingAttributeException;
use App\Http\Controllers\Controller;
use App\Prometheus\Counter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Uri;

class OIDCController extends Controller
{
    protected const string REDIRECT_URL = '/external_login';

    public function __construct(protected OIDCProvider $provider)
    {
        $this->middleware('guest')->except('redirect');
    }

    /**
     * Redirect to the OpenID Provider for authentication with an optional redirect back to a specific URL
     */
    public function redirect(OIDCRedirectRequest $request)
    {
        if (Auth()->check()) {
            $uri = Uri::of(self::REDIRECT_URL)->withQuery(['no_message' => true]);
            if ($request->has('redirect')) {
                return redirect($uri
                    ->withQuery(['redirect' => $request->query('redirect')])
                    ->value());
            }

            return redirect($uri->value());
        }

        try {
            return $this->provider->redirect($request->query('redirect'));
        } catch (OpenIDConnectNetworkException $e) {
            Counter::get('login_failed_total')->inc('oidc');
            Log::error('OIDC login redirection failed: '.$e->getMessage());

            return redirect('/external_login?error=openid_connect_network_exception');
        } catch (\Throwable $e) {
            Counter::get('login_failed_total')->inc('oidc');
            Log::error('OIDC login redirection failed: '.$e->getMessage());

            return redirect('/external_login?error=openid_connect_exception');
        }
    }

    /**
     * Handle Authorization Code Flow redirect back from the OpenID Provider with an Authorization Code
     */
    public function callback(OIDCCallbackRequest $request): RedirectResponse
    {
        try {
            $user = $this->provider->login($request);
        } catch (OpenIDConnectCodeMissingException $e) {
            Counter::get('login_failed_total')->inc('oidc');
            Log::warning('OIDC login failed: '.$e->getMessage());

            return redirect()->route('auth.oidc.redirect');
        } catch (MissingAttributeException $e) {
            Counter::get('login_failed_total')->inc('oidc');

            return redirect('/external_login?error=missing_attributes');
        } catch (OpenIDConnectNetworkException $e) {
            Counter::get('login_failed_total')->inc('oidc');
            Log::error('OIDC login failed: '.$e->getMessage());

            return redirect('/external_login?error=openid_connect_network_exception');
        } catch (\Throwable $e) {
            Counter::get('login_failed_total')->inc('oidc');
            Log::error('OIDC login failed: '.$e->getMessage());

            // Any other error that occurs during the login process
            return redirect('/external_login?error=openid_connect_exception');
        }

        Counter::get('login_total')->inc('oidc');
        Log::info('External user {user} has been successfully authenticated.', ['user' => $user->getLogLabel(), 'type' => 'oidc']);

        // Update the last login timestamp
        $user->last_login = now();
        $user->save();

        if (session()->has('redirect_url')) {
            return redirect(Uri::of(self::REDIRECT_URL)
                ->withQuery(['redirect' => session()->get('redirect_url')])
                ->value());
        }

        return redirect(self::REDIRECT_URL);
    }

    /**
     * Handle the back-channel logout request from OpenID Provider
     */
    public function logout(Request $request): Response
    {
        return $this->provider->backChannelLogout($request);
    }
}
