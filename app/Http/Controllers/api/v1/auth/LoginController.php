<?php

namespace App\Http\Controllers\api\v1\auth;

use App\Auth\Shibboleth\ShibbolethProvider;
use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\AuthenticatesUsers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

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
        login as protected loginApplication;
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

    public function login(Request $request)
    {
        // Check if local login is enabled
        if (!config('auth.local.enabled')) {
            abort(404);
        }

        return $this->loginApplication($request);
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
        Log::info('Local user '. $user->email .' has been successfully authenticated.');
    }

    public function logout(Request $request)
    {
        $redirect        = false;
        $externalAuth    = false;
        $externalSignOut = false;

        if (session()->has('external_auth')) {
            switch(session()->get('external_auth')) {
                case 'shibboleth':
                    $externalAuth = 'shibboleth';
                    $url          = app(ShibbolethProvider::class)->logout(url('/logout'));
                    if ($url) {
                        $redirect        = $url;
                        $externalSignOut = true;
                    }

                    break;
            }
        }

        $this->logoutApplication($request);

        return response()->json([
            'redirect'          => $redirect,
            'external_auth'     => $externalAuth,
            'external_sign_out' => $externalSignOut
        ]);
    }
}
