<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class LoggedInUser extends Middleware
{
    protected function authenticate($request)
    {
        if (empty($guards)) {
            $guards = [null];
        }

        $guards = ['api_users','api'];

        foreach ($guards as $guard) {
            if ($this->auth->guard($guard)->check()) {
                return $this->auth->shouldUse($guard);
            }
        }

        return;
    }
}
