<?php

namespace App\Listeners;

use App\Role;
use LdapRecord\Laravel\Events\Imported;
use Spatie\Permission\Exceptions\RoleDoesNotExist;

class SetDefaultRoleForLdapUser
{
    /**
     * @param Imported $event
     *
     * @throws RoleDoesNotExist
     */
    public function handle(Imported $event)
    {
        $ldapRoleAttribute = config('ldap.ldapRoleAttribute');

        if ($event->user->hasAttribute($ldapRoleAttribute)) {
            $ldapRole = $event->user->getFirstAttribute($ldapRoleAttribute);
            $user     = $event->model;

            if (array_key_exists($ldapRole, config('ldap.roleMap'))) {
                // TODO: Change after pull request #21 was merged!
                $role = Role::findByName(config('ldap.roleMap')[$ldapRole], 'api');
                if (!$user->hasRole($role)) {
                    $user->assignRole($role);
                }
            }
        }
    }
}
