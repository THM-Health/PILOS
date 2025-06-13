<?php

namespace App\Auth\LDAP;

use App\Auth\MissingAttributeException;
use App\Http\Controllers\Controller;
use App\Prometheus\Counter;
use Illuminate\Foundation\Auth\AuthenticatesUsers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class LDAPController extends Controller
{
    use AuthenticatesUsers {
        login as ldapLogin;
    }

    public function __construct()
    {
        $this->middleware('guest');
    }

    /**
     * Username field name
     */
    public function username()
    {
        return 'username';
    }

    /**
     * Credentials passed to the Auth::attempt() method of the LDAP guard
     */
    protected function credentials(Request $request)
    {
        return [
            'password' => $request->input('password'),
            'username' => $request->input('username'),
        ];
    }

    /**
     * The guard used for LDAP authentication
     */
    protected function guard()
    {
        return Auth::guard('ldap');
    }

    /**
     * Process the login request
     *
     * @return void
     */
    public function login(Request $request)
    {
        try {
            // Run login method from AuthenticatesUsers trait
            return $this->ldapLogin($request);
        } catch (MissingAttributeException $e) {
            // If an attribute is missing during the login process, return error
            Counter::get('login_failed_total')->inc('ldap');

            return abort(500, __('auth.error.missing_attributes'));
        }
    }

    /**
     * The user has been authenticated.
     *
     * @param  mixed  $user
     * @return mixed
     */
    protected function authenticated(Request $request, $user)
    {
        // Log successful authentication
        Counter::get('login_total')->inc('ldap');
        Log::info('External user {user} has been successfully authenticated.', ['user' => $user->getLogLabel(), 'type' => 'ldap']);

        // Update the last login timestamp
        $user->last_login = now();
        $user->save();
    }
}
