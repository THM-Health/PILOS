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
            if ($event->guard == 'ldap') {
                Log::info('External user '.$event->credentials[config('ldap.login_attribute')].' has failed authentication.', ['ip'=>request()->ip(),'user-agent'=>request()->header('User-Agent'), 'type' => 'ldap']);
            } else {
                Log::info('Local user '.$event->credentials['email'].' has failed authentication.', ['ip'=>request()->ip(),'user-agent'=>request()->header('User-Agent')]);
            }
        }
    }
}
