<?php

namespace App\Auth\LDAP;

use App\Auth\MissingAttributeException;
use App\Http\Controllers\Controller;
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
            'password' => $request->get('password'),
            'username' => $request->get('username')
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
     * @param  Request $request
     * @return void
     */
    public function login(Request $request)
    {
        try {
            // Run login method from AuthenticatesUsers trait
            return $this->ldapLogin($request);
        } catch (MissingAttributeException $e) {
            // If an attribute is missing during the login process, return error
            return abort(500, __('auth.error.missing_attributes'));
        }
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
        // Log successful authentication
        Log::info('External user '.$user->external_id.' has been successfully authenticated.', ['type' => 'ldap']);
    }
}
