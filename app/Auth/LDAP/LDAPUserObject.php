<?php

namespace App\Auth\LDAP;

use LdapRecord\Models\Model;
use LdapRecord\Query\Model\Builder;

class LDAPUserObject extends Model
{
    /**
     * The "booting" method of the model.
     *
     * @return void
     */
    protected static function boot(): void
    {
        parent::boot();

        static::$objectClasses = config('ldap.object_classes');
    }

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);

        $this->guidKey = config('ldap.guid_key');
    }

    /**
     * Get a new query for builder filtered by the current models object classes.
     */
    public function newQuery(): Builder
    {
        $query = $this->registerModelScopes(
            $this->newQueryWithoutScopes()
        );

        // Only select the attributes that are defined in the mapping
        $attributeMap   = config('ldap.mapping')->attributes;
        foreach ($attributeMap as $attribute) {
            $query->addSelect($attribute);
        }

        // Add optinal filter to the query
        $query->rawFilter(config('ldap.filter'));

        return $query;
    }
}
