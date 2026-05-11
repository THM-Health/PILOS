<?php

declare(strict_types=1);

namespace App\Auth\Shibboleth;

use App\Auth\MissingAttributeException;
use App\Http\Controllers\Controller;
use App\Prometheus\Counter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Uri;

class ShibbolethController extends Controller
{
    protected const string REDIRECT_URL = '/external_login';

    public function __construct(protected ShibbolethProvider $provider)
    {
        $this->middleware('guest')->except(['logout', 'redirect']);
    }

    /**
     * Redirect to the Shibboleth for authentication with an optional redirect back to a specific URL
     */
    public function redirect(ShibbolethRedirectRequest $request)
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

        return $this->provider->redirect($request->query('redirect'));
    }

    /**
     * Handle the logout request from Shibboleth.
     */
    public function logout(Request $request)
    {
        // Front channel logout
        if ($request->query('return') && $request->query('action') == 'logout') {
            return $this->provider->frontChannelLogout($request->query('return'));
        }

        // Back channel logout
        if (! empty($request->getContent())) {
            return $this->provider->backChannelLogout($request->getContent());
        }
    }

    /**
     * Request to login with shibboleth, route is protected by mod-shibb of the reverse proxy
     */
    public function callback(ShibbolethCallbackRequest $request)
    {
        try {
            $user = $this->provider->login($request);
        } catch (MissingAttributeException $e) {
            Counter::get('login_failed_total')->inc('shibboleth');

            return redirect('/external_login?error=missing_attributes');
        } catch (ShibbolethSessionDuplicateException $e) {
            // Prevented login attempt with duplicate shibboleth session, redirect to logout to kill SP session
            return redirect($this->provider->logout(url('/external_login?error=shibboleth_session_duplicate_exception')));
        }

        Counter::get('login_total')->inc('shibboleth');
        Log::info('External user {user} has been successfully authenticated.', ['user' => $user->getLogLabel(), 'type' => 'shibboleth']);

        // Update the last login timestamp
        $user->last_login = now();
        $user->save();

        // Redirect to the external login page in the frontend, optionally with a redirect back to a specific URL
        if ($request->has('redirect')) {
            return redirect(Uri::of(self::REDIRECT_URL)
                ->withQuery(['redirect' => $request->query('redirect')])
                ->value());
        }

        return redirect(self::REDIRECT_URL);
    }
}
