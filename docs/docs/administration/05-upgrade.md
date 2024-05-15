---
title: Upgrade
---

## Introduction
This document describes the upgrade process from PILOS v2/v3 to PILOS v4.
Before upgrading, please make sure you have the latest version of PILOS v2/v3 installed.

Please make sure to back up your database and files before upgrading, so you can restore them in case of any issues.

## Database

### MariaDB
In v4, the MariaDB version has been bumped to 11.
All new installations will use this version, existing installations will not be automatically upgraded.

#### Upgrade MariaDB container (optional)
To upgrade your MariaDB container, please follow these steps:

1. Edit your `docker-compose.yml` file and change the MariaDB image from:

    ```yaml
        db:
          image: 'mariadb:11'
    ```
    
    to the new version:
    
    ```yaml
        db:
          image: 'mariadb:11'
    ```

2. Add a new environment variable `MARIADB_AUTO_UPGRADE` to the service to upgrade the database:
    ```yaml
       db:
         image: 'mariadb:11'
         environment:
           MARIADB_AUTO_UPGRADE: 1
    ```

3. After completing the whole upgrade process, you can remove the `MARIADB_AUTO_UPGRADE` environment variable.

### Database schema changes
The database schema has changed quite a lot from v2/3 to v4.
This was necessary for many new features and a more stable global application settings storage.

1. Disable automatic database migration by setting the `.env` variable `RUN_MIGRATIONS=false`
2. Replace the image tag in your `.env` with the new v4 image tag: `CONTAINER_IMAGE=pilos/pilos:v4`
3. Run `docker compose up -d` to start the new version of PILOS
4. Run the upgrade command: `docker compose exec app pilos-cli db:upgrade`
5. Run all additional migrations: `docker compose exec app php artisan migrate`
6. Enable automatic database migration again by setting the `.env` variable `RUN_MIGRATIONS=true`

We try to migrate all old settings to new storage as good as possible, but some settings may be lost if they are not used anymore or the old option is not available in the new version.
Please check the settings in the admin UI after the migration.

## .env variables

TODO

## Locales
Many translations have been added and changed. Please check the `resources/lang` folder for new translations and adjust your custom translations accordingly.
