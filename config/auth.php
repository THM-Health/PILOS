<?php

use App\Auth\LDAP\LDAPUserObject;
use App\Models\User;

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Defaults
    |--------------------------------------------------------------------------
    |
    | This option controls the default authentication "guard" and password
    | reset options for your application. You may change these defaults
    | as required, but they're a perfect start for most applications.
    |
    */

    'defaults' => [
        'guard'     => 'users',
        'passwords' => 'users',
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards
    |--------------------------------------------------------------------------
    |
    | Next, you may define every authentication guard for your application.
    | Of course, a great default configuration has been defined for you
    | here which uses session storage and the Eloquent user provider.
    |
    | All authentication drivers have a user provider. This defines how the
    | users are actually retrieved out of your database or other storage
    | mechanisms used by this application to persist your user's data.
    |
    | Supported: "session", "token"
    |
    */

    'guards' => [
        'ldap' => [
            'driver'   => 'session',
            'provider' => 'ldap',
        ],
        'users' => [
            'driver'   => 'session',
            'provider' => 'users',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | User Providers
    |--------------------------------------------------------------------------
    |
    | All authentication drivers have a user provider. This defines how the
    | users are actually retrieved out of your database or other storage
    | mechanisms used by this application to persist your user's data.
    |
    | If you have multiple user tables or models you may configure multiple
    | sources which represent each model / table. These sources may then
    | be assigned to any extra authentication guards you have defined.
    |
    | Supported: "database", "eloquent"
    |
    */

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model'  => User::class,
        ],

        'ldap' => [
            'driver'   => 'ldap',
            'model' => User::class,
        ],

        // 'users' => [
        //     'driver' => 'database',
        //     'table' => 'users',
        // ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Resetting Passwords
    |--------------------------------------------------------------------------
    |
    | You may specify multiple password reset configurations if you have more
    | than one user table or model in the application and you want to have
    | separate password reset settings based on the specific user types.
    |
    | The expiry time is the number of minutes that the reset token should be
    | considered valid. This security feature keeps tokens short-lived so
    | they have less time to be guessed. You may change this as needed.
    |
    */

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => 'password_resets',
            'expire' => env('PASSWORD_RESET_EXPIRE', 60),
            'throttle' => env('PASSWORD_RESET_THROTTLE', 60),
        ],
        'new_users' => [
            'provider' => 'users',
            'table' => 'password_resets',
            'expire' => env('NEW_USER_PASSWORD_RESET_EXPIRE', 60),
            'throttle' => env('NEW_USER_PASSWORD_RESET_THROTTLE', 60),
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | Changing Email
    |--------------------------------------------------------------------------
    |
    | These settings control the email change feature for users with a local account (provider = users).
    |
    | The expire time is the number of minutes that the verification token should be
    | considered valid.
    |
    | The throttle time is the number of seconds that a user must wait before requesting
    | another verification token. If throttle is set to 0, throttling is disabled.
    |
    */

    'email_change' => [
        'expire' => env('EMAIL_CHANGE_EXPIRE', 60),
        'throttle' => env('EMAIL_CHANGE_THROTTLE', 250),
    ],

    /*
    |--------------------------------------------------------------------------
    | Password Confirmation Timeout
    |--------------------------------------------------------------------------
    |
    | Here you may define the amount of seconds before a password confirmation
    | times out and the user is prompted to re-enter their password via the
    | confirmation screen. By default, the timeout lasts for three hours.
    |
    */

    'password_timeout' => 10800,

    'log' => [
        'successful' => env('AUTH_LOG_SUCCESSFUL', false),
        'failed'     => env('AUTH_LOG_FAILED', false),
        'roles' => env('AUTH_LOG_ROLES', false),
    ]
];
