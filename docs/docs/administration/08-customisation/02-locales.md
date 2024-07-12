---
title: Locales
description: Contribute to the translation of PILOS and add custom locales
---

PILOS is available in multiple languages. By default, PILOS comes with English and German translations.
Other locales are maintained by the community using [PoEditor](https://poeditor.com/join/project/UGpZY4JAnz).

## Locale structure
Locales are stored as php arrays in the `resources/custom/lang` folder.
Each locale has its own subdirectory named after the locale code (e.g. en).
Within the directory each group has its own file (part before the first dot in the translation string), e.g. 'app' or 'auth'.
For example, the string `auth.ldap.username_help` would be stored in the file `auth.php`.

Within the file, the keys are organized in nested php arrays.

## Overriding locales

You can override the default locales by creating custom locale files in the `resources/custom/lang` directory.
The locales are merged during runtime, so you only need to define the keys you want to override.

### Example
To override the LDAP username help text in the english locale, create a custom locale file `resources/custom/lang/en/auth.php`:
```php
<?php

return [
    'ldap' =>  [
        'username_help' => 'My custom help text'
    ]
];
```

To customize the date time format and the display name of a locale create a json file `metadata.json` in the locales directory.
```json
{
    "name": "German",
    "dateTimeFormat":  {
        "dateShort": { 
            "year": "numeric",
            "month": "2-digit",
            "day": "2-digit" 
        },
        "dateLong": {
            "year": "numeric",
            "month": "short",
            "day": "2-digit"
        },
        "time": {
            "hour": "2-digit",
            "minute": "2-digit",
            "hour12": false
        },
        "datetimeShort": {
            "year": "numeric",
            "month": "2-digit",
            "day": "2-digit",
            "hour": "2-digit",
            "minute": "2-digit",
            "hour12": false
        },
        "datetimeLong": {
            "year": "numeric",
            "month": "short",
            "day": "2-digit",
            "hour": "2-digit",
            "minute": "2-digit",
            "hour12": false
        }
      }

}
```

## New locales
To add custom locales that are not part of the core, add them to the `resources/custom/lang` directory.
You need to create all php files and metadata.json file.
Any missing keys will be filled with the default english translation.
To enable the new locale, you need to add it to the `ENABLED_LOCALES` in the `.env` file.

## Locale caching
For better performance, locales are automatically cached in production when the container is started.

To manually cache the locales, run the following command:
```shell
docker compose exec app pilos-cli locales:cache
```
