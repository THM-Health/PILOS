<?php

namespace App\Auth\OIDC;

use App\Auth\ExternalUser;

class OIDCUser extends ExternalUser
{
    protected $raw_attributes;

    public function __construct(array $oidc_user)
    {
        $attributeMap = config('services.oidc.mapping')->attributes;

        foreach ($attributeMap as $attribute => $oidc_attribute) {
            foreach ($oidc_user as $attribute_name => $value) {
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
    }
}
