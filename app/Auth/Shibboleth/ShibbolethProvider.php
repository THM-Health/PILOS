<?php

namespace App\Auth\Shibboleth;

use App\Models\SessionData;
use Auth;
use Cache;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use SoapServer;

class ShibbolethProvider
{
    public function logout($redirect)
    {
        return  config('services.shibboleth.logout').'?return='.$redirect;
    }

    public function frontChannelLogout(string $returnUrl)
    {
        //Only destroy application cookie via front channel and destroy the application session via back channel

        if (\Auth::user() && session('external_auth') == 'shibboleth') {
            \Auth::logout();
        }

        // Send user to the return URL
        return redirect($returnUrl);
    }

    public function backChannelLogout()
    {
        $server = new SoapServer(url()->current());
        $server->setClass(SoapServerHandler::class);
        $server->handle();
    }

    public function wsdlServer()
    {
        $wsdlTemplate = file_get_contents(__DIR__.'/LogoutNotification.wsdl');

        $wsdlConfig = str_replace('LOCATION_PLACEHOLDER', url()->current(), $wsdlTemplate);

        return response($wsdlConfig, 200, [
            'Content-Type' => 'application/xml'
        ]);
    }
    
    public function redirect($redirect = null)
    {
        $params = [];
        if ($redirect) {
            $params['redirect'] = $redirect;
        }

        return redirect(route('auth.shibboleth.callback', $params));
    }

    /**
     * @throws MissingAttributeException
     * @throws ShibbolethSessionDuplicateException
     */
    public function login(Request $request)
    {
        // Create new shibboleth user
        $saml_user = new ShibbolethUser($request);
       
        // Get eloquent user (existing or new)
        $user = $saml_user->createOrFindEloquentModel('shibboleth');

        // Sync attributes and map roles
        $saml_user->syncWithEloquentModel($user, config('services.shibboleth.mapping')->roles);

        // Get shibboleth session id
        $hasedShibbolethSessionId = $this->hashShibbolethSessionId($request->header(config('services.shibboleth.session_id_header')));
        $expiresShibbolethSession = $request->header(config('services.shibboleth.session_expires_header'));
        
        // Cache key and expiration time to prevent duplicate login attempts with the same shibboleth session id
        $cacheKey     = 'shibboleth_session_'.$hasedShibbolethSessionId;
        $cacheExpires = Carbon::createFromTimestamp($expiresShibbolethSession);

        // Check if shibboleth session id is already in use by other sessions
        $lookupSessions = SessionData::where('key', 'shibboleth_session_id')->where('value', $hasedShibbolethSessionId)->get();
        foreach ($lookupSessions as $lookupSession) {
            // Delete all application sessions with the same shibboleth session id
            $lookupSession->session()->delete();
        }

        // If shibboleth session id is already in use or was used before, throw exception and log attempt
        if ($lookupSessions->isNotEmpty() || Cache::has($cacheKey)) {
            Log::notice('Prevented login attempt with duplicate shibboleth session');

            throw new ShibbolethSessionDuplicateException();
        }

        // Login the user / start application session
        Auth::login($user);

        // Store shibboleth session id in cache to prevent duplicate login attempts
        Cache::put($cacheKey, true, $cacheExpires);

        // Store shibboleth session id in session data table to find application session based in the shibboleth session id
        session(['session_data' => [
            ['key'=>'shibboleth_session_id', 'value' => $hasedShibbolethSessionId],
        ]]);

        // Store authentication method and shibboleth session id in session
        // to validate each request in the ValidateShibbolethSession middleware
        session()->put('external_auth', 'shibboleth');
        session()->put('shibboleth_session_id', $hasedShibbolethSessionId);

        return $user;
    }

    public function hashShibbolethSessionId($shibbolethSessionId)
    {
        return hash('sha256', $shibbolethSessionId);
    }
}
