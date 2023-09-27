<?php

namespace App\Auth\Shibboleth;

use App\Auth\MissingAttributeException;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ShibbolethController extends Controller
{
    public function __construct(protected ShibbolethProvider $provider)
    {
        $this->middleware('guest')->except(['logout']);
    }

    /**
     * Redirect to the Shibboleth for authentication with an optional redirect back to a specific URL
     */
    public function redirect(Request $request)
    {
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
        if (!empty($request->getContent())) {
            return $this->provider->backChannelLogout($request->getContent());
        }
    }

    /**
     * Request to login with shibboleth, route is protected by mod-shibb of the reverse proxy
     */
    public function callback(Request $request)
    {
        try {
            $user = $this->provider->login($request);
        } catch(MissingAttributeException $e) {
            return redirect('/external_login?error=missing_attributes');
        } catch(ShibbolethSessionDuplicateException $e) {
            // Prevented login attempt with duplicate shibboleth session, redirect to logout to kill SP session
            return redirect($this->provider->logout(url('/external_login?error=shibboleth_session_duplicate_exception')));
        }

        Log::info('External user {user} has been successfully authenticated.', ['user' => $user->getLogLabel(), 'type' => 'shibboleth']);

        // Redirect to the external login page in the frontend, optionally with a redirect back to a specific URL
        $url         = '/external_login';
        $redirectUrl = $request->get('redirect');

        return redirect($redirectUrl ? ($url.'?redirect='.urlencode($redirectUrl)) : $url);
    }
}
