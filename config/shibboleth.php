<?php

return [

    'enabled'   => env('SHIBBOLETH_ENABLED', false),
    'attribute' => [
        'sn'                   => env('SHIBBOLETH_ATTR_SN', 'sn'),
        'givenName'            => env('SHIBBOLETH_ATTR_GIVEN_NAME', 'givenName'),
        'uid'                  => env('SHIBBOLETH_ATTR_UID', 'uid'),
        'mail'                 => env('SHIBBOLETH_ATTR_MAIL', 'mail'),
        'eduPersonAffiliation' => env('SHIBBOLETH_ATTR_EDU_PERSON_AFFILIATION', 'eduPersonAffiliation'),
    ],
    'sessionId' => env('SHIBBOLETH_SESSION_ID','Shib-Session-ID'),
    'roleMap' => array_reduce(array_filter(explode(',', env('SHIBBOLETH_ROLE_MAP', ''))), function ($carry, $value) {
        [$ldapRole, $role] = explode('=', $value);
        $carry[$ldapRole] = $role;
        return $carry;
    }, [])
];
