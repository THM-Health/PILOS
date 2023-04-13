<?php

namespace App\Auth\LDAP;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\AuthenticatesUsers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class LDAPController extends Controller
{

    use AuthenticatesUsers;

    public function __construct()
    {
        $this->middleware('guest');
    }

    public function username()
    {
        return 'username';
    }

    protected function credentials(Request $request)
    {
        return [
            'password' => $request->get('password'),
            config('ldap.login_attribute') => $request->get('username')
        ];
    }

    protected function guard()
    {
        return Auth::guard('ldap');
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
            Log::info('External user '.$user->external_id.' has been successfully authenticated.', ['ip' => $request->ip(), 'user-agent' => $request->header('User-Agent'), 'type' => 'ldap']);
        }
    }
}
