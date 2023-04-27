<?php

namespace App\Auth\LDAP;

use LdapRecord\Laravel\LdapUserAuthenticator as UserAuthenticator;

class LDAPUserAuthenticator extends UserAuthenticator
{
    public function __construct(array $rules = [])
    {
        parent::__construct($rules);

        // Override the default authentication method
        $this->authenticateUsing(function ($user, $password) {
            // Attempt to authenticate the user with the given credentials and keep the bind active
            return $user->getConnection()->auth()->attempt($user->getDn(), $password, true);
        });
    }
}
