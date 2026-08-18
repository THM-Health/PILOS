<?php

declare(strict_types=1);

namespace App\Auth\OIDC;

use App\Auth\ExternalUser;

class OIDCUser extends ExternalUser
{
    public function __construct(array $oidc_user)
    {
        // Load the attribute mapping from the config
        $attributeMap = config('services.oidc.mapping')->attributes;

        // Loop through the attribute mapping
        foreach ($attributeMap as $attribute => $oidc_attribute) {
            // Loop through the OIDC user attributes
            foreach ($oidc_user as $attribute_name => $value) {
                // If the current OIDC attribute matches the name of the OIDC attribute in the mapping,
                // add values to the attributes of the user
                if (strcasecmp($oidc_attribute, $attribute_name) == 0) {
                    // If the value is an array, add each sub-value
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
    }
}
