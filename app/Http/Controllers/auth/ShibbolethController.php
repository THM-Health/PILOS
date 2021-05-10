<?php

namespace App\Http\Controllers\auth;

use App\Http\Controllers\Controller;
use App\Role;
use App\User;
use Cache;
use Hash;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ShibbolethController extends Controller
{
    public function login(Request $request)
    {
        if (!Auth::guest()) {
            return redirect('/');
        }

        // read shibboleth attributes
        $shibLastname   = $_SERVER[config('shibboleth.attribute.sn')];
        $shibFirstname  = $_SERVER[config('shibboleth.attribute.givenName')];
        $shibUsername   = $_SERVER[config('shibboleth.attribute.uid')];
        $shibEmail      = $_SERVER[config('shibboleth.attribute.mail')];
        $shibRoles      = $_SERVER[config('shibboleth.attribute.eduPersonAffiliation')];
        $shibSessionId  = $_SERVER[config('shibboleth.sessionId')];

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
        $expire          = $_SERVER['SHIBBOLETH_Shib-Session-Expires'];
        $secondsToExpire = now()->diffInSeconds(Date::createFromTimestamp($expire));
        Cache::put('shib-session-'.$shibSessionId, true, $secondsToExpire);

        // try to find existing user
        $user = User::where('username', $shibUsername)->where('authenticator', 'shibboleth')->first();
        // if user doesn't exist, create new
        if ($user == null) {
            $user                = new User();
            $user->authenticator = 'shibboleth';
            $user->username      = $shibUsername;
            $user->firstname     = $shibFirstname;
            $user->lastname      = $shibLastname;
            $user->email         = $shibEmail;
            $user->password      = Hash::make(Str::random());
            $user->save();
        } else {
            // update existing user
            $user->firstname = $shibFirstname;
            $user->lastname  = $shibLastname;
            $user->email     = $shibEmail;
            $user->save();
        }

        // update automatic roles
        $roleIds   = [];
        $shibRoles = explode(';', $shibRoles);
        foreach ($shibRoles as $shibRole) {
            if (array_key_exists($shibRole, config('shibboleth.roleMap'))) {
                $role = Role::where('name', config('shibboleth.roleMap')[$shibRole])->first();
                if (!empty($role)) {
                    $roleIds[$role->id] = ['automatic' => true];
                }
            }
        }

        $user->roles()->syncWithoutDetaching($roleIds);
        $user->roles()->detach($user->roles()->wherePivot('automatic', '=', true)->whereNotIn('role_id', array_keys($roleIds))->pluck('role_id')->toArray());

        // log user in
        Auth::login($user);

        // set shibboleth session id for the user to detect changes on all further requests
        // validated by the validateShibbolethSession Middleware
        session(['Shib-Session-ID' => $shibSessionId]);

        if (config('auth.log.successful')) {
            Log::info('User ['.$user->username.'] has been successfully authenticated.', ['ip'=>$request->ip(),'user-agent'=>$request->header('User-Agent'),'authenticator'=>'shibboleth']);
        }

        if ($request->has('redirect')) {
            return redirect($request->input('redirect'));
        }

        return redirect('/');
    }
}
