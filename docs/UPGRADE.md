# Upgrade from PILOS v2/v3 to PILOS v4

## General
This document describes the upgrade process from PILOS v2/v3 to PILOS v4.
Before upgrading, please make sure you have the latest version of PILOS v2/v3 installed.

Please make sure to back up your database and files before upgrading, so you can restore them in case of any issues.

## Database
The database schema has changed quite a lot from v2/3 to v4.
This was necessary for many new features and a more stable global application settings storage.

To migrate to v4 just run: `php artisan db:upgrade` or if you are using sail: `sail artisan db:upgrade`

We try to migrate all old settings to new storage as good as possible, but some settings may be lost if they are not used anymore or the old option is not available in the new version.
Please check the settings in the admin UI after the migration.

## Changed .env variables

TODO

## Locales
Many translations have been added and changed. Please check the `resources/lang` folder for new translations and adjust your custom translations accordingly.
