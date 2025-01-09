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
    /**
     * Logout url for Shibboleth
     */
    public function logout($redirect)
    {
        return config('services.shibboleth.logout').'?return='.$redirect;
    }

    /**
     * Front channel logout; destroy application session and redirect to the return URL
     */
    public function frontChannelLogout(string $returnUrl)
    {
        // Only destroy application cookie via front channel and destroy the application session via back channel

        if (\Auth::user()?->authenticator == 'shibboleth') {
            \Auth::logout();
        }

        // Send user to the return URL
        return redirect($returnUrl);
    }

    /**
     * Back channel logout; destroy application session based on the shibboleth session id in the SOAP request
     */
    public function backChannelLogout($requestMessage)
    {
        // Create SOAP server config
        $wsdlTemplate = file_get_contents(__DIR__.'/LogoutNotification.wsdl');
        $wsdlConfig = str_replace('LOCATION_PLACEHOLDER', url()->current(), $wsdlTemplate);
        $uri = 'data://text/plain;base64,'.base64_encode($wsdlConfig);

        // Create SOAP server
        $server = new SoapServer($uri);
        $server->setClass(SoapServerHandler::class);

        // Handle request and capture response
        ob_start();
        $server->handle($requestMessage);
        $response = ob_get_contents();
        ob_end_clean();

        return response($response, 200, [
            'Content-Type' => 'text/xml',
        ]);
    }

    /**
     * Redirect to Shibboleth for authentication with an optional redirect back to a specific URL
     */
    public function redirect($redirect = null)
    {
        $params = [];
        if ($redirect) {
            $params['redirect'] = $redirect;
        }

        return redirect(route('auth.shibboleth.callback', $params));
    }

    /**
     * Handle login request
     *
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
        $hashedShibbolethSessionId = $this->hashShibbolethSessionId($request->header(config('services.shibboleth.session_id_header')));
        $expiresShibbolethSession = $request->header(config('services.shibboleth.session_expires_header'));

        // Cache key and expiration time to prevent duplicate login attempts with the same shibboleth session id
        $cacheKey = 'shibboleth_session_'.$hashedShibbolethSessionId;
        $cacheExpires = Carbon::createFromTimestamp($expiresShibbolethSession);

        // Check if shibboleth session id is already in use by other sessions
        $lookupSessions = SessionData::where('key', 'shibboleth_session_id')->where('value', $hashedShibbolethSessionId)->get();
        foreach ($lookupSessions as $lookupSession) {
            // Delete all application sessions with the same shibboleth session id
            $lookupSession->session()->delete();
        }

        // If shibboleth session id is already in use or was used before, throw exception and log attempt
        if ($lookupSessions->isNotEmpty() || Cache::has($cacheKey)) {
            Log::notice('Prevented login attempt with duplicate shibboleth session');

            throw new ShibbolethSessionDuplicateException;
        }

        // Login the user / start application session
        Auth::login($user);

        // Store shibboleth session id in cache to prevent duplicate login attempts
        Cache::put($cacheKey, true, $cacheExpires);

        // Store shibboleth session id in session data table to find application session based in the shibboleth session id
        // The session is not yet stored in the database (stored after this request),
        // therefore we cannot create a new SessionData model here but use the StoreSessionData middleware
        session(['session_data' => [
            ['key' => 'shibboleth_session_id', 'value' => $hashedShibbolethSessionId],
        ]]);

        // Store shibboleth session id in session
        // to validate each request in the ValidateShibbolethSession middleware
        session()->put('shibboleth_session_id', $hashedShibbolethSessionId);

        return $user;
    }

    public function hashShibbolethSessionId($shibbolethSessionId)
    {
        return hash('sha256', $shibbolethSessionId);
    }
}
