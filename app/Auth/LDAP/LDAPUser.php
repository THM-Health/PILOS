<?php

namespace App\Auth\LDAP;

use App\Auth\ExternalUser;
use Log;

class LDAPUser extends ExternalUser
{
    public function __construct(LDAPUserObject $ldap_user)
    {
        // Get the attributes from the LDAP user object
        $raw_attributes = $ldap_user->getAttributes();

        if (config('ldap.logging.enabled')) {
            Log::debug('LDAP attributes', $raw_attributes);
        }

        // Load the attribute mapping from the config
        $attributeMap = config('ldap.mapping')->attributes;

        // Loop through the attribute mapping
        foreach ($attributeMap as $attribute => $ldap_attribute) {
            // Loop through the LDAP user attributes
            foreach ($raw_attributes as $attribute_name => $attribute_values) {
                // If the current LDAP attribute matches the name of the LDAP attribute in the mapping
                // add all values to the attribute of the user
                if (strcasecmp($ldap_attribute, $attribute_name) == 0) {
                    foreach ($attribute_values as $value) {
                        $this->addAttributeValue($attribute, $value);
                    }
                }
            }
        }
    }
}
