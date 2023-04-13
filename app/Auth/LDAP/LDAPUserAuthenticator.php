<?php

namespace App\Auth\LDAP;

use LdapRecord\Laravel\LdapUserAuthenticator as UserAuthenticator;

class LDAPUserAuthenticator extends UserAuthenticator
{

    public function __construct(array $rules = [])
    {
        parent::__construct($rules);

        $this->authenticateUsing(function ($user, $password) {
            return $user->getConnection()->auth()->attempt($user->getDn(), $password, true);
        });
    }
}
