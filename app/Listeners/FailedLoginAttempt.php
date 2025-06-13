<?php

namespace App\Listeners;

use App\Prometheus\Counter;
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
     * @return void
     */
    public function handle(Failed $event)
    {
        if ($event->guard == 'ldap') {
            Counter::get('login_failed_total')->inc('ldap');
            Log::notice('External user '.$event->credentials['username'].' has failed authentication.', ['type' => 'ldap']);
        } else {
            Counter::get('login_failed_total')->inc('local');
            Log::notice('Local user '.$event->credentials['email'].' has failed local authentication.');
        }
    }
}
