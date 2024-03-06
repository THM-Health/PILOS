<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default Settings Store
    |--------------------------------------------------------------------------
    |
    | This option controls the default settings store that gets used while
    | using this settings library.
    |
    | Supported: "json", "database"
    |
    */
    'store' => 'database',

    /*
    |--------------------------------------------------------------------------
    | JSON Store
    |--------------------------------------------------------------------------
    |
    | If the store is set to "json", settings are stored in the defined
    | file path in JSON format. Use full path to file.
    |
    */
    'path' => storage_path().'/settings.json',

    /*
    |--------------------------------------------------------------------------
    | Database Store
    |--------------------------------------------------------------------------
    |
    | The settings are stored in the defined file path in JSON format.
    | Use full path to JSON file.
    |
    */
    // If set to null, the default connection will be used.
    'connection' => null,
    // Name of the table used.
    'table' => 'settings',
    // If you want to use custom column names in database store you could
    // set them in this configuration
    'keyColumn' => 'key',
    'valueColumn' => 'value',

    /*
    |--------------------------------------------------------------------------
    | Cache settings
    |--------------------------------------------------------------------------
    |
    | If you want all setting calls to go through Laravel's cache system.
    |
    */
    'enableCache' => true,
    // Whether to reset the cache when changing a setting.
    'forgetCacheByWrite' => true,
    // TTL in seconds.
    'cacheTtl' => 15,

    /*
    |--------------------------------------------------------------------------
    | Default Settings
    |--------------------------------------------------------------------------
    |
    | Define all default settings that will be used before any settings are set,
    | this avoids all settings being set to false to begin with and avoids
    | hardcoding the same defaults in all 'Settings::get()' calls
    |
    */
    'defaults' => [
        'name' => env('APP_NAME', 'PILOS'),
        'logo' => env('DEFAULT_LOGO', '/images/logo.svg'),
        'favicon' => env('DEFAULT_FAVICON', '/images/favicon.ico'),
        'room_limit' => env('DEFAULT_ROOM_LIMIT', -1),
        //@deprecate OWN_ROOMS_PAGINATION_PAGE_SIZE
        'room_pagination_page_size' => env('ROOM_PAGINATION_PAGE_SIZE', env('OWN_ROOMS_PAGINATION_PAGE_SIZE', 9)),
        'pagination_page_size' => env('DEFAULT_PAGINATION_PAGE_SIZE', 15),
        'statistics' => [
            'servers' => [
                'enabled' => env('STATISTICS_SERVERS_ENABLED', false),
                'retention_period' => env('STATISTICS_SERVERS_RETENTION_PERIOD', 30),
            ],
            'meetings' => [
                'enabled' => env('STATISTICS_MEETINGS_ENABLED', false),
                'retention_period' => env('STATISTICS_MEETINGS_RETENTION_PERIOD', 30),
            ],
        ],
        'attendance' => [
            'enabled' => env('ATTENDANCE_ENABLED', false),
            'retention_period' => env('ATTENDANCE_RETENTION_PERIOD', 14),
        ],
        'banner' => [
            'enabled' => false,
        ],
        //@deprecate PASSWORD_SELF_RESET_ENABLED
        'password_change_allowed' => env('PASSWORD_CHANGE_ALLOWED', env('PASSWORD_SELF_RESET_ENABLED', true)),
        'default_timezone' => env('DEFAULT_TIMEZONE', 'UTC'),
        'help_url' => env('HELP_URL'),
        'legal_notice_url' => env('LEGAL_NOTICE_URL'),
        'privacy_policy_url' => env('PRIVACY_POLICY_URL'),
        'room_token_expiration' => env('ROOM_TOKEN_EXPIRATION', -1),
        'room_auto_delete' => [
            'enabled' => env('ROOM_AUTO_DELETE_ENABLED', false),
            'inactive_period' => env('ROOM_AUTO_DELETE_INACTIVE_PERIOD', 365),
            'never_used_period' => env('ROOM_AUTO_DELETE_NEVER_USED_PERIOD', 90),
            'deadline_period' => env('ROOM_AUTO_DELETE_DEADLINE_PERIOD', 14),
        ],
    ],
];
