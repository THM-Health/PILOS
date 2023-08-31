<?php

namespace App\Http\Controllers\api\v1\auth;

use App\Auth\Shibboleth\ShibbolethProvider;
use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\AuthenticatesUsers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
        Log::info('Local user '. $user->email .' has been successfully authenticated.');
    }

    public function logout(Request $request)
    {
        $redirect        = false;

        if (session()->has('external_auth')) {
            switch(session()->get('external_auth')) {
                case 'shibboleth':
                    $url             = app(ShibbolethProvider::class)->logout(url('/logout'));
                    $redirect        = $url;

                    break;
            }
        }

        $this->logoutApplication($request);

        return response()->json([
            'redirect'          => $redirect
        ]);
    }
}
