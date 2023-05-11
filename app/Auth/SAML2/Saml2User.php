<?php

namespace App\Auth\SAML2;

use App\Auth\ExternalUser;
use Log;

class Saml2User extends ExternalUser
{
    public function __construct(\Laravel\Socialite\Contracts\User $saml_user)
    {
        $raw_attributes = $saml_user->user;

        if ($raw_attributes == null) {
            Log::error('No attributes found in SAML response');

            return;
        }

        $attributeMap = config('services.saml2.mapping')->attributes;

        foreach ($attributeMap as $attribute=>$saml_attribute) {
            foreach ($raw_attributes as $raw_attribute) {
                if (strcasecmp($saml_attribute, $raw_attribute->getName()) == 0) {
                    $attribute_values = $raw_attribute->getAllAttributeValues();
                    foreach ($attribute_values as $value) {
                        $this->addAttributeValue($attribute, $value);
                    }
                }
            }
        }
    }
}
