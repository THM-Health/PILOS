<?php

declare(strict_types=1);

$enabled = env('OAUTH_ENABLED', false);

$privateKeyPem = null;
$publicKeyPem = null;
$privateKeyDetails = false;

if ($enabled) {
    $privateKeyPem = env('OAUTH_PRIVATE_KEY');

    // Parse private key
    $parsedPrivateKey = openssl_pkey_get_private($privateKeyPem);

    // Successfully parsed private key
    if ($parsedPrivateKey !== false) {
        $privateKeyDetails = openssl_pkey_get_details($parsedPrivateKey);

        // Extract public key from private key
        if ($privateKeyDetails !== false) {
            $publicKeyPem = $privateKeyDetails['key'];
        }
    }
}

return [

    'enabled' => $enabled,

    /*
    |--------------------------------------------------------------------------
    | Passport Guard
    |--------------------------------------------------------------------------
    |
    | Here you may specify which authentication guard Passport will use when
    | authenticating users. This value should correspond with one of your
    | guards that is already present in your "auth" configuration file.
    |
    */

    'guard' => null,

    'middleware' => [],

    /*
    |--------------------------------------------------------------------------
    | Encryption Keys
    |--------------------------------------------------------------------------
    |
    | Passport uses encryption keys while generating secure access tokens for
    | your application. By default, the keys are stored as local files but
    | can be set via environment variables when that is more convenient.
    |
    */

    'private_key_details' => $privateKeyDetails,

    'private_key' => $privateKeyPem,
    'public_key' => $publicKeyPem,

    'token_lifetime' => (int) env('OAUTH_TOKEN_LIFETIME', 60 * 60),
    'refresh_token_lifetime' => (int) env('OAUTH_REFRESH_LIFETIME', 365 * 24 * 60 * 60),
];
