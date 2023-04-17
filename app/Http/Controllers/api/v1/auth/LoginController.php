<?php

namespace App\Http\Controllers\api\v1\auth;

use App\Auth\OIDC\OIDCProvider;
use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Foundation\Auth\AuthenticatesUsers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use LdapRecord\Models\ModelNotFoundException;
use LdapRecord\Models\OpenLDAP\User as LdapUser;

class LoginController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Login Controller
    |--------------------------------------------------------------------------
    |
    | This controller handles authenticating users for the application and
    | redirecting them to your home screen. The controller uses a trait
    | to conveniently provide its functionality to your applications.
    |
    */

    use AuthenticatesUsers {
        logout as protected logoutApplication;
    }

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('guest')->except(['logout']);
        $this->middleware('auth:users,ldap')->only(['logout']);
    }

    public function username()
    {
        return 'email';
    }

    protected function credentials(Request $request)
    {
        return [
            'password'      => $request->get('password'),
            'authenticator' => 'local',
            'email'         => $request->get('email')
        ];
    }

    /**
     * The user has been authenticated.
     *
     * @param  \Illuminate\Http\Request $request
     * @param  mixed                    $user
     * @return mixed
     */
    protected function authenticated(Request $request, $user)
    {
        if (config('auth.log.successful')) {
            Log::info('Local user '. $user->email .' has been successfully authenticated.', ['ip' => $request->ip(), 'user-agent' => $request->header('User-Agent')]);
        }
    }

    public function logout(Request $request){
        $redirect = false;
        $externalAuth = false;
        $externalSignOut = false;

        if(session()->has('external_auth')){

            switch(session()->get('external_auth')){
                case 'oidc':
                    $externalAuth = 'oidc';
                    $url = Socialite::driver('oidc')->logout(session()->get('oidc_id_token'), url("/logout"));
                    if($url){
                        $redirect = $url;
                        $externalSignOut = true;
                    }
                    break;
                case 'saml2':
                    $externalAuth = 'saml2';
                    $url = Socialite::driver('saml2')->logout(session()->get('saml2_name_id'), url("/logout"));
                    if($url){
                        $redirect = $url;
                        $externalSignOut = true;
                    }
                    break;  
            }
        }

        $this->logoutApplication($request);

        return response()->json([
            'redirect' => $redirect,
            'external_auth' => $externalAuth,
            'external_sign_out' => $externalSignOut
        ]);
    }
}
