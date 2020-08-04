<?php

namespace App\Http\Controllers\api\v1\auth;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\AuthenticatesUsers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Resources\User as UserResource;

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

    use AuthenticatesUsers;

    private $guard = null;

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('guest')->except(['logout', 'currentUser']);
        $this->middleware('auth:users,ldap')->only(['currentUser', 'logout']);
    }

    public function currentUser()
    {
        return new UserResource(Auth::user());
    }

    public function username()
    {
        if ($this->guard == 'ldap') {
            return 'username';
        }

        return 'email';
    }

    public function ldapLogin(Request $request)
    {
        $this->guard = 'ldap';

        return $this->login($request);
    }

    public function usersLogin(Request $request)
    {
        $this->guard = 'users';

        return $this->login($request);
    }

    protected function credentials(Request $request)
    {
        $credentials = [
            'password' => $request->get('password')
        ];

        if ($this->guard === 'ldap') {
            $credentials['uid'] = $request->get('username');
        } else {
            $credentials['authenticator'] = 'users';
            $credentials['email']         = $request->get('email');
        }

        return $credentials;
    }

    protected function guard()
    {
        if ($this->guard !== null) {
            return Auth::guard($this->guard);
        }

        return Auth::guard();
    }
}
