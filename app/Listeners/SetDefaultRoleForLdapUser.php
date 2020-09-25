<?php

namespace App\Listeners;

use App\Role;
use Illuminate\Auth\Events\Authenticated;
use LdapRecord\Models\ModelNotFoundException;
use LdapRecord\Models\OpenLDAP\User;

class SetDefaultRoleForLdapUser
{
    /**
     * Handle the event that gets fired if a new user model was imported from ldap.
     *
     * Adds the roles from the ldap user to the application user, which are mapped
     * in the config `ldap.roleMap`.
     *
     * @param Authenticated $event
     * @throws ModelNotFoundException
     */
    public function handle(Authenticated $event)
    {
        $user = $event->user;

        if ($user->authenticator === 'ldap') {
            $ldapRoleAttribute = config('ldap.ldapRoleAttribute');
            $ldapUser = User::findByGuidOrFail($user->getLdapGuid());

            if ($ldapUser->hasAttribute($ldapRoleAttribute)) {
                $ldapRoles = $ldapUser->getAttribute($ldapRoleAttribute);
                $roleIds   = [];

                foreach ($ldapRoles as $ldapRole) {
                    if (array_key_exists($ldapRole, config('ldap.roleMap'))) {
                        $role = Role::where('name', config('ldap.roleMap')[$ldapRole])->first();

                        if (!empty($role)) {
                            $roleIds[$role->id] = ['automatic' => true];
                        }
                    }
                }

                $user->roles()->syncWithoutDetaching($roleIds);
                $user->roles()->detach($user->roles()->wherePivot('automatic', '=', true)->whereNotIn('role_id', array_keys($roleIds))->pluck('role_id')->toArray());
            }
        }
    }
}
