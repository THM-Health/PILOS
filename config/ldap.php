<?php

$ldapEnabled = env('LDAP_ENABLED', false);

return [

    'enabled'   => $ldapEnabled,

    

    'connection' => [
        'hosts' => [env('LDAP_HOST', '127.0.0.1')],
        'username' => env('LDAP_USERNAME', 'cn=user,dc=local,dc=om'),
        'password' => env('LDAP_PASSWORD', 'secret'),
        'port' => env('LDAP_PORT', 389),
        'base_dn' => env('LDAP_BASE_DN', 'dc=local,dc=com'),
        'timeout' => env('LDAP_TIMEOUT', 5),
        'use_ssl' => env('LDAP_SSL', false),
        'use_tls' => env('LDAP_TLS', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | LDAP Logging
    |--------------------------------------------------------------------------
    |
    | When LDAP logging is enabled, all LDAP search and authentication
    | operations are logged using the default application logging
    | driver. This can assist in debugging issues and more.
    |
    */

    'logging' => env('LDAP_LOGGING', false),

    'load_attributes_as_user' => env('LDAP_LOAD_ATTRIBUTES_AS_USER', false),

    /*
    |--------------------------------------------------------------------------
    | LDAP Role Mapping
    |--------------------------------------------------------------------------
    |
    | To map ldap roles to the corresponding roles in this application set
    | the correct ldap role attribute in the .env file and also a map from
    | ldap roles to the roles in the application. Make sure that the roles
    | exists in the application, otherwise the not existing mapped role
    | wouldn't be assign to the user.
    |
    */

    'guid_key' => env('LDAP_GUID_KEY', 'entryuuid'),

    'filter' => env('LDAP_FILTER', ''),

    'object_classes' => explode(",",env('LDAP_OBJECT_CLASSES', 'top,person,organizationalperson,inetorgperson')),

    'login_attribute' => env('LDAP_LOGIN_ATTRIBUTE', 'uid'),

    'mapping' => $ldapEnabled ? json_decode(file_get_contents(app_path('Auth/config/ldap_mapping.json'))) : null,
];
