<?php

namespace App\Listeners;


use Illuminate\Support\Facades\Log;
use LdapRecord\Laravel\Events\Authenticated;

class SetProtectedLdapAttributes
{

    public function handle(Authenticated $event)
    {
        $ldapUser = $event->user->getConnection()->query()->find($event->user->getDn());
        $userclass = $ldapUser['userclass'];
        $user = $event->model;
        // @TODO Map ldap userclass to internal class, save or overwrite
        //$user->role = json_encode($userclass);
        //$user->save();
    }
}
