<?php

namespace App\Auth\SAML2;

use App\Auth\ExternalUser;

class Saml2User extends ExternalUser
{
    public function __construct(\Laravel\Socialite\Contracts\User $saml_user)
    {
        $raw_attributes = $saml_user->user;

        $attributeMap = config('services.saml2.mapping')->attributes;

        foreach ($attributeMap as $attribute=>$saml_attribute){
            foreach ($raw_attributes as $raw_attribute){
                
                if(strcasecmp($saml_attribute, $raw_attribute->getName()) == 0){
                    $this->addAttributeValue($attribute, $raw_attribute->getFirstAttributeValue());
                }
            }
        }
    }
}
