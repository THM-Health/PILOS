<?php

namespace App\Http\Controllers\api\v1\auth;

use App\Auth\OIDC\OIDCController;
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
            'password' => $request->input('password'),
            'email' => $request->input('email'),
        ];
    }

    /**
     * The user has been authenticated.
     *
     * @param  mixed  $user
     * @return mixed
     */
    protected function authenticated(Request $request, $user)
    {
        Log::info('Local user '.$user->email.' has been successfully authenticated.');
    }

    public function logout(Request $request)
    {
        // Redirect url after logout
        $redirect = false;

        // Logout from external authentication provider
        switch (\Auth::user()->authenticator) {
            case 'shibboleth':
                $redirect = app(ShibbolethProvider::class)->logout(url('/logout'));
                break;
            case 'oidc':
                $redirect = app(OIDCController::class)->logoutRedirectURL();
                break;
        }

        // Destroy application session
        $this->logoutApplication($request);

        return response()->json([
            'redirect' => $redirect,
        ]);
    }
}
