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

    public function redirect(Request $request)
    {
        return $this->provider->redirect($request->post('redirect'));
    }

    public function logout(Request $request)
    {
        // Front channel logout
        if ($request->query('return') && $request->query('action') == 'logout') {
            return $this->provider->frontChannelLogout($request->query('return'));
        }

        // Back channel logout
        elseif (!empty($request->getContent())) {
            return $this->provider->backChannelLogout();
        } else {
            // WSDL server config for back channel logout
            return $this->provider->wsdlServer();
        }
    }

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

        $url = '/external_login';

        $redirectUrl = $request->get('redirect');

        return redirect($redirectUrl ? ($url.'?redirect='.urlencode($redirectUrl)) : $url);
    }
}
