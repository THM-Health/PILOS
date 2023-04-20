<?php

namespace App\Auth\LDAP;

use LdapRecord\Models\Model;

class LDAPUserObject extends Model
{
    /**
     * The "booting" method of the model.
     *
     * @return void
     */
    protected static function boot()
    {
        parent::boot();

        static::$objectClasses = config('ldap.object_classes');
    }

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);

        $this->guidKey = config('ldap.guid_key');
    }
}
