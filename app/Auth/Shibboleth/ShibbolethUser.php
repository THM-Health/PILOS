<?php

// SPDX-FileCopyrightText: 2023 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Auth\Shibboleth;

use App\Auth\ExternalUser;
use Illuminate\Http\Request;

class ShibbolethUser extends ExternalUser
{
    public function __construct(Request $request)
    {
        // Get the attribute map from the config
        $attributeMap = config('services.shibboleth.mapping')->attributes;

        // Loop through the attribute map and add the values to the user
        foreach ($attributeMap as $attribute => $saml_attribute) {
            // Split the attribute values on the semicolon (used to separate multiple values)
            $re = '/(?<!\\\\);/';
            $attribute_values = preg_split($re, $request->header($saml_attribute, ''));

            // Add all attribute values to the user object
            foreach ($attribute_values as $value) {
                $this->addAttributeValue($attribute, $value);
            }
        }
    }
}
