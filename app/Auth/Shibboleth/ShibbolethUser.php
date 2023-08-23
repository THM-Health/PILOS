<?php

namespace App\Auth\Shibboleth;

use App\Auth\ExternalUser;
use Illuminate\Http\Request;

class ShibbolethUser extends ExternalUser
{
    public function __construct(Request $request)
    {
        $attributeMap = config('services.shibboleth.mapping')->attributes;

        foreach ($attributeMap as $attribute=>$saml_attribute) {
            $re               = '/(?<!\\\\);/';
            $attribute_values = preg_split($re, $request->header($saml_attribute));

            foreach ($attribute_values as $value) {
                $this->addAttributeValue($attribute, $value);
            }
        }
    }
}
