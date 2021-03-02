<?php

namespace App\Listeners;

use LdapRecord\Laravel\Events\Importing;

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
        $event->model->locale   = config('app.locale');
        $event->model->timezone = setting('default_timezone');
    }
}
