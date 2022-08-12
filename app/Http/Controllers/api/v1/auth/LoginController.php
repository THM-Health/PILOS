<?php

namespace App\Http\Controllers\api\v1\auth;

use App\Http\Controllers\Controller;
use App\Role;
use Illuminate\Auth\Events\Authenticated;
use Illuminate\Foundation\Auth\AuthenticatesUsers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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

    use AuthenticatesUsers;

    private $guard = null;

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
        if ($this->guard == 'ldap') {
            return 'username';
        }

        return 'email';
    }

    public function ldapLogin(Request $request)
    {
        if (!config('ldap.enabled')) {
            abort(404);
        }

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
            $guard = Auth::guard($this->guard);

            if ($this->guard === 'ldap') {
                $authenticator = $guard->getProvider()->getLdapUserAuthenticator();
                $authenticator->authenticateUsing(function ($user, $password) {
                    return $user->getConnection()->auth()->attempt($user->getDn(), $password, true);
                });
            }

            return $guard;
        }

        return Auth::guard();
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
            Log::info('User [' . ($user->authenticator == 'ldap' ? $user->username : $user->email) . '] has been successfully authenticated.', ['ip' => $request->ip(), 'user-agent' => $request->header('User-Agent'), 'authenticator' => $user->authenticator]);
        }

        if ($user->authenticator === 'ldap' && config('ldap.ldapRoleAttribute')) {
            $this->mapLdapRoles($user);
        }
    }

    /**
     * Adds the roles from the ldap user to the application user, which are mapped
     * in the config `ldap.roleMap`.
     *
     * @param                         $user
     * @throws ModelNotFoundException
     */
    protected function mapLdapRoles($user)
    {
        $ldapRoleAttribute = config('ldap.ldapRoleAttribute');
        $ldapUser          = LdapUser::findByGuidOrFail($user->getLdapGuid(),['*',$ldapRoleAttribute]);

        if ($ldapUser->hasAttribute($ldapRoleAttribute)) {
            $ldapRoles = $ldapUser->getAttribute($ldapRoleAttribute);

            if (config('auth.log.ldap_roles')) {
                \Log::debug('LDAP roles found for user ['.$user->username.'].', $ldapRoles);
            }

            $roleIds   = [];

            foreach ($ldapRoles as $ldapRole) {
                if (array_key_exists($ldapRole, config('ldap.roleMap'))) {
                    $role = Role::where('name', config('ldap.roleMap')[$ldapRole])->first();

                    if (!empty($role)) {
                        $roleIds[$role->id] = ['automatic' => true];
                    }
                }
            }

            $user->roles()->syncWithoutDetaching($roleIds);
            $user->roles()->detach($user->roles()->wherePivot('automatic', '=', true)->whereNotIn('role_id', array_keys($roleIds))->pluck('role_id')->toArray());
        }
    }
}
