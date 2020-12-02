<?php

namespace App\Listeners;

use LdapRecord\Laravel\Events\Importing;

class SetUserModelDefaultLocale
{
    /**
     * Sets the default locale when a new model is importing.
     *
     * @param  Importing $event
     * @return void
     */
    public function handle(Importing $event)
    {
        $event->model->locale = config('app.locale');
    }
}
