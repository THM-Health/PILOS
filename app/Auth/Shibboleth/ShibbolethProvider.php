<?php

namespace App\Auth\Shibboleth;

use Auth;
use Illuminate\Http\Request;
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
            session()->invalidate();
            session()->regenerateToken();
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
     */
    public function login(Request $request)
    {
        /*

        @TODO: Check if this additional code is needed, added in the initial implementation

         // Check if session was already used for an other login request
         $session = Cache::has('shib-session-'.$shibSessionId);
         if ($session) {
             // if shibboleth session was used for another request,
             // try to find the shibboleth cookie, remove it and reload page
             // to force a new login login and shibboleth session
             foreach ($request->cookies->keys() as $cookie) {
                 $regexshib='/^_shibsession_[a-z0-9]/';
                 if (preg_match($regexshib, $cookie)) {
                     \Cookie::queue(\Cookie::forget($cookie));
                 }
             }
 
             return redirect($request->fullUrl());
         }
 
         // Create cache item to prevent usage of the same session for another login request
         // valid until the session expires
         $secondsToExpire = now()->diffInSeconds(Date::createFromTimestamp($shibSessionExpires));
         Cache::put('shib-session-'.$shibSessionId, true, $secondsToExpire);
        */

        // Create new shibboleth user
        $saml_user = new ShibbolethUser($request);
       
        // Get eloquent user (existing or new)
        $user = $saml_user->createOrFindEloquentModel();

        // Sync attributes and map roles
        $saml_user->syncWithEloquentModel($user, config('services.shibboleth.mapping')->roles);
        
        // Login the user / start application session
        Auth::login($user);

        // Get shibboleth session id
        $shibbolethSessionId = $request->header(config('services.shibboleth.session_id_header'));

        // Store shibboleth session id in session data table to find application session based in the shibboleth session id
        session(['session_data' => [
            ['key'=>'shibboleth_session_id', 'value' => $shibbolethSessionId],
        ]]);

        // Store authentication method and shibboleth session id in session
        // to validate each request in the ValidateShibbolethSession middleware
        session()->put('external_auth', 'shibboleth');
        session()->put('shibboleth_session_id', $shibbolethSessionId);

        return $user;
    }
}
