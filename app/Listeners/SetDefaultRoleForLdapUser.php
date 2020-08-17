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
            $ldapRoles = $event->user->getAttribute($ldapRoleAttribute);
            $user      = $event->model;
            $roleIds   = [];

            foreach ($ldapRoles as $ldapRole) {
                if (array_key_exists($ldapRole, config('ldap.roleMap'))) {
                    $role = Role::where('name', config('ldap.roleMap')[$ldapRole])->first();

                    if (!empty($role)) {
                        array_push($roleIds, $role->id);
                    }
                }
            }

            $user->roles()->syncWithoutDetaching($roleIds);
        }
    }
}
