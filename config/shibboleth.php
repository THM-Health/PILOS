<?php

$prefix = env('SHIBBOLETH_PREFIX');

return [

    'enabled'   => env('SHIBBOLETH_ENABLED', false),
    'attribute' => [
        'sn'                   => $prefix.env('SHIBBOLETH_ATTR_SN', 'sn'),
        'givenName'            => $prefix.env('SHIBBOLETH_ATTR_GIVEN_NAME', 'givenName'),
        'uid'                  => $prefix.env('SHIBBOLETH_ATTR_UID', 'uid'),
        'mail'                 => $prefix.env('SHIBBOLETH_ATTR_MAIL', 'mail'),
        'eduPersonAffiliation' => $prefix.env('SHIBBOLETH_ATTR_EDU_PERSON_AFFILIATION', 'eduPersonAffiliation'),
    ],
    'sessionId' => $prefix.env('SHIBBOLETH_SESSION_ID','Shib-Session-ID'),
    'sessionExpires' => $prefix.env('SHIBBOLETH_SESSION_EXPIRES','Shib-Session-Expires'),
    'roleMap' => array_reduce(array_filter(explode(',', env('SHIBBOLETH_ROLE_MAP', ''))), function ($carry, $value) {
        [$ldapRole, $role] = explode('=', $value);
        $carry[$ldapRole] = $role;
        return $carry;
    }, [])
];
