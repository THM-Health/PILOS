<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PasswordConfirmation extends RequirePassword
{
    /**
     * Determine if the confirmation timeout has expired.
     *
     * @param  Request $request
     * @return bool
     */
    protected function shouldConfirmPassword($request)
    {
        if (Auth::user()->autehnticator !== 'users') {
            return false;
        }

        $confirmedAt = time() - $request->session()->get('auth.password_confirmed_at', 0);

        return $confirmedAt > $this->passwordTimeout;
    }
}
