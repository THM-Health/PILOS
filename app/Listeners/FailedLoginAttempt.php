<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Failed;
use Illuminate\Support\Facades\Log;

class FailedLoginAttempt
{
    /**
     * Create the event listener.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     *
     * @param  Failed $event
     * @return void
     */
    public function handle(Failed $event)
    {
        if (config('auth.log.failed')) {
            Log::info('User ['.($event->guard == 'ldap' ? $event->credentials['uid'] : $event->credentials['email']).'] has failed LDAP authentication.', ['ip'=>request()->ip(),'user-agent'=>request()->header('User-Agent'),'authenticator'=>$event->guard]);
        }
    }
}
