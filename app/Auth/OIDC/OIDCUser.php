<?php

namespace App\Auth\OIDC;

use App\Auth\ExternalUser;

class OIDCUser extends ExternalUser
{
    protected $raw_attributes;

    public function __construct(\Laravel\Socialite\Contracts\User $oidc_user)
    {
        $this->raw_attributes = $oidc_user->user;

        $attributeMap = config('services.oidc.mapping')->attributes;

        foreach ($attributeMap as $attribute => $oidc_attribute) {
            foreach ($this->raw_attributes as $attribute_name => $value) {
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

    public function getRawAttributes()
    {
        return $this->raw_attributes;
    }
}
