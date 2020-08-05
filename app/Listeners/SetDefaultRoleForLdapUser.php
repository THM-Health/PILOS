<?php

namespace App\Listeners;

use App\Role;
use App\User;
use LdapRecord\Laravel\Events\Imported;

class SetDefaultRoleForLdapUser
{
    /**
     * Handle the event that gets fired if a new user model was imported from ldap.
     *
     * Adds the roles from the ldap user to the application user, which are mapped
     * in the config `ldap.roleMap`.
     *
     * @param Imported $event
     */
    public function handle(Imported $event)
    {
        $ldapRoleAttribute = config('ldap.ldapRoleAttribute');

        if ($event->user->hasAttribute($ldapRoleAttribute)) {
            $ldapRole = $event->user->getFirstAttribute($ldapRoleAttribute);
            $user     = $event->model;

            if (array_key_exists($ldapRole, config('ldap.roleMap'))) {
                $role = Role::where('name', config('ldap.roleMap')[$ldapRole])->first();
                if (!empty($role) && $user->roles->where('name', $role->name)->count() == 0) {
                    $user->roles()->attach($role->id);
                }
            }
        }
    }
}
