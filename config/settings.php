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
        'room_limit' => env('DEFAULT_ROOM_LIMIT',-1),
        'own_rooms_pagination_page_size' => env('OWN_ROOMS_PAGINATION_PAGE_SIZE',5),
        'pagination_page_size' => env('DEFAULT_PAGINATION_PAGE_SIZE', 15),
        'log_attendance' => env('LOG_ATTENDANCE', false),
        'banner' => [
            'enabled' => false
        ],
        'password_self_reset_enabled' => env('PASSWORD_SELF_RESET_ENABLED', false),
        'default_timezone' => env('DEFAULT_TIMEZONE', 'UTC'),
        'help_url' => env('HELP_URL'),
        'room_token_expiration' => env('ROOM_TOKEN_EXPIRATION', -1)
    ]
];
