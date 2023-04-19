<?php

$oidcEnabled = env('OIDC_ENABLED', false);
$saml2Enabled = env('SAML2_ENABLED', false);

$saml2MetadataUrl = env('SAML2_METADATA_URL', null);

if($saml2Enabled){
    if($saml2MetadataUrl) {
        $saml2Metadata = $saml2MetadataUrl;
    } else {
        $saml2Metadata = file_get_contents(base_path('saml2/metadata.xml'));
    }
}
else {
    $saml2Metadata = null;
}

$saml2SignAndEncrypt = env('SAML2_SIGN_ENCRYPT', false);

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
        'enabled' => $saml2Enabled,
        'metadata' => $saml2Metadata,
        'ttl' => env('SAML2_TTL',3600),
        'sp_acs' => 'auth/saml2/callback',
        'sp_sls' => 'auth/saml2/logout',
        'sp_default_binding_method' => \LightSaml\SamlConstants::BINDING_SAML2_HTTP_POST,
        'mapping' => $saml2Enabled ? json_decode(file_get_contents(app_path('Auth/Mapping/saml2.json'))) : null,
        'sp_certificate' => $saml2SignAndEncrypt ? file_get_contents(base_path('ssl/fullchain.pem')) : null,
        'sp_private_key' => $saml2SignAndEncrypt ? file_get_contents(base_path('ssl/privkey.pem')) : null,
    ],

    'oidc' => [
        'enabled' => $oidcEnabled,
        'issuer' =>  env('OIDC_ISSUER'),
        'client_id' => env('OIDC_CLIENT_ID'),
        'client_secret' => env('OIDC_CLIENT_SECRET'),
        'redirect' => 'auth/oidc/callback',
        'ttl' => env('OIDC_TTL',3600),
        'scopes' => explode(",",env('OIDC_SCOPES', 'email,profile')),
        'mapping' => $oidcEnabled ? json_decode(file_get_contents(app_path('Auth/Mapping/oidc.json'))) : null,
    ]
];
