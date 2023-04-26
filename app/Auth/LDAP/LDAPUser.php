<?php

namespace App\Auth\LDAP;

use App\Auth\ExternalUser;

class LDAPUser extends ExternalUser
{
    public function __construct(LDAPUserObject $ldap_user)
    {
        $raw_attributes = $ldap_user->getAttributes();
        $attributeMap   = config('ldap.mapping')->attributes;

        foreach ($attributeMap as $attribute=>$oidc_attribute) {
            foreach ($raw_attributes as $attribute_name=>$attribute_values) {
                if (strcasecmp($oidc_attribute, $attribute_name) == 0) {
                    foreach ($attribute_values as $value) {
                        $this->addAttributeValue($attribute, $value);
                    }
                }
            }
        }

        parent::__construct();
    }
}
