<?php

namespace App\Listeners;

use LdapRecord\Laravel\Events\Import\Importing;

class SetUserModelLdapAuthenticatorType
{
    /**
     * Sets the authenticator type to `ldap` when a new model is importing.
     *
     * @param  Importing $event
     * @return void
     */
    public function handle(Importing $event)
    {
        $event->eloquent->authenticator = 'ldap';
    }
}
