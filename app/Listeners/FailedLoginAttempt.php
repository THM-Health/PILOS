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
        if ($event->guard == 'ldap') {
            Log::notice('External user '.$event->credentials['username'].' has failed authentication.', [ 'type' => 'ldap']);
        } else {
            Log::notice('Local user '.$event->credentials['email'].' has failed local authentication.');
        }
    }
}
