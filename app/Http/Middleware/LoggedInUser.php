<?php

namespace App\Http\Middleware;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Middleware\Authenticate as Middleware;

class LoggedInUser extends Middleware
{
    /**
     * Set the auth helpers without enforcing authentication
     * Required on routes that should be used by guests and authentication users,
     * to use Auth::user
     *
     * @param  \Illuminate\Http\Request  $request
     * @return void
     */
    protected function authenticate($request, array $guards)
    {
        try {
            parent::authenticate($request, $guards);
        } catch (AuthenticationException $exception) {
        }
    }
}
