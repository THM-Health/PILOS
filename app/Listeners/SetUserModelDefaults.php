<?php

namespace App\Listeners;

use LdapRecord\Laravel\Events\Import\Importing;

class SetUserModelDefaults
{
    /**
     * Sets the default locale when a new model is importing.
     *
     * @param  Importing $event
     * @return void
     */
    public function handle(Importing $event)
    {
        $event->eloquent->locale   = config('app.locale');
        $event->eloquent->timezone = setting('default_timezone');
    }
}
