<?php

namespace App\Auth\LDAP;

use App\Auth\ExternalUserService;
use LdapRecord\Laravel\Events\Import\Importing;
use LdapRecord\Laravel\Events\Import\Synchronized;
use LdapRecord\Laravel\Events\Import\Synchronizing;
use LdapRecord\Laravel\Import\UserSynchronizer;
use LdapRecord\Models\Model as LdapModel;

class LDAPUserSynchronizer extends UserSynchronizer
{
    public function run(LdapModel $object, array $data = [])
    {
        // Create new ldap user
        $lpda_user = new LDAPUser($object);
                        
        // Get eloquent user (existing or new)
        $user = $lpda_user->createOrFindEloquentModel();

        if (! $user->exists) {
            event(new Importing($object, $user));
        }

        event(new Synchronizing($object, $user));

        // Sync attributes
        $lpda_user->syncWithEloquentModel();


        // Note: We are not saving the user here, as the user is saved after successful authentication.

        // Note: We are not mapping roles here, as the roles are mapped after successful authentication, as the roles might only be available after binding with the current user.
        // The roles are mapped in the SetUserLDAPRole class.
        
        event(new Synchronized($object, $user));

        return $user;
    }
}
