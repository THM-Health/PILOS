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
            foreach ($raw_attributes as $attribute_name=>$value) {
                if (strcasecmp($oidc_attribute, $attribute_name) == 0) {
                    if (is_array($value)) {
                        foreach ($value as $sub_value) {
                            $this->addAttributeValue($attribute, $sub_value);
                        }
                    } else {
                        $this->addAttributeValue($attribute, $value);
                    }
                }
            }
        }

        parent::__construct();
    }
}
