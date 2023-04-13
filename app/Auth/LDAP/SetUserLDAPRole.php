<?php

namespace App\Auth\LDAP;

use App\Auth\RoleMapping;
use LdapRecord\Laravel\Events\Import\Saved;

class SetUserLDAPRole
{

    /**
     * Adds the roles from the ldap user to the application user, which are mapped
     * in the config `ldap.roleMap`.
     *
     * @param Saved $event
     * @return void
     * @throws \LdapRecord\Models\ModelNotFoundException
     *
     */
    public function handle(Saved $event)
    {
        $eloquentModel = $event->eloquent;

        // Create new ldap user
        $ldap_user = new LDAPUser(LDAPUserObject::findByGuidOrFail($event->object->getObjectGuid()));         

        // Map roles
        $roleMapping = new RoleMapping();
        $roleMapping->mapRoles($ldap_user->getAttributes(),$eloquentModel, config('ldap.mapping')->roles);
    }
}
