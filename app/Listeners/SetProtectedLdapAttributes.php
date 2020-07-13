<?php

namespace App\Listeners;

use App\Role;
use LdapRecord\Laravel\Events\Authenticated;
use Spatie\Permission\Exceptions\RoleDoesNotExist;

class SetProtectedLdapAttributes
{
    /**
     * @param Authenticated $event
     *
     * @throws RoleDoesNotExist
     */
    public function handle(Authenticated $event)
    {
        $ldapUser          = $event->user->getConnection()->query()->find($event->user->getDn());
        $ldapRoleAttribute = config('ldap.ldapRoleAttribute');

        if (array_key_exists($ldapRoleAttribute, $ldapUser) && !empty($ldapUser[$ldapRoleAttribute])) {
            $ldapRole = $ldapUser[$ldapRoleAttribute];
            $user     = $event->model;

            if (array_key_exists($ldapRole, config('ldap.roleMap'))) {
                $role = Role::findByName(config('ldap.roleMap')[$ldapRole]);
                if (!$user->hasRole($role)) {
                    $user->assignRole($role);
                }
            }
        }
    }
}
