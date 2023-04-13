<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'saml2' => [
        'enabled' => true,
        'metadata' => file_get_contents(base_path('saml2/metadata.xml')),
        'sp_acs' => 'auth/saml2/callback',
        'sp_sls' => 'auth/saml2/logout',
        'sp_default_binding_method' => \LightSaml\SamlConstants::BINDING_SAML2_HTTP_POST,
        'mapping' => json_decode(file_get_contents(app_path('Auth/Mapping/saml2.json'))),
        'sp_certificate' => file_get_contents(base_path('ssl/fullchain.pem')),
        'sp_private_key' => file_get_contents(base_path('ssl/privkey.pem')),
    ],

    'oidc' => [
        'enabled' => env('OIDC_ENABLED', false),
        'issuer' =>  env('OIDC_ISSUER'),
        'client_id' => env('OIDC_CLIENT_ID'),
        'client_secret' => env('OIDC_CLIENT_SECRET'),
        'redirect' => 'auth/oidc/callback',
        'ttl' => env('OIDC_TTL',3600),
        'scopes' => explode(",",env('OIDC_SCOPES', 'email,profile')),
        'mapping' => json_decode(file_get_contents(app_path('Auth/Mapping/oidc.json'))),
    ]
];
