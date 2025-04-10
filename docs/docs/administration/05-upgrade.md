---
title: Upgrade
---

## Introduction

This document describes the upgrade process from PILOS v2/v3 to PILOS v4.
Before upgrading, please make sure you have the latest version of PILOS v2/v3 installed.

Please make sure to back up your database and files before upgrading, so you can restore them in case of any issues.

## Starting the upgrade

To start the upgrade process, stop your current PILOS installation by running:

```bash
docker compose down
```

## Replace the app service

In v2/v3 only one service was used for the app. In v4 the app service was split into three services: `app`, `cron` and `horizon`.

- **app**: Frontend and backend with nginx and php-fpm
- **cron**: Cronjob runner
- **horizon**: Laravel Horizon for queue jobs

As all services use the same image, environment variables and volumes, these are defined in a common section in the `docker-compose.yml` file.
Replace the app service in the `docker-compose.yml` file:

```yaml
x-docker-pilos-common: &pilos-common
    env_file: .env
    volumes:
        - "./storage/app:/var/www/html/storage/app"
        - "./storage/recordings:/var/www/html/storage/recordings"
        - "./storage/recordings-spool:/var/www/html/storage/recordings-spool"
        - "./app/Auth/config:/var/www/html/app/Auth/config"
services:
    app:
        image: "${CONTAINER_IMAGE:-pilos/pilos:latest}"
        ports:
            - "127.0.0.1:5000:80"
        <<: *pilos-common
        sysctls:
            net.core.somaxconn: 65536
            net.ipv4.ip_local_port_range: "2000 65535"
            net.ipv4.tcp_tw_reuse: 1
            net.ipv4.tcp_fin_timeout: 30
        healthcheck:
            test: curl --fail http://localhost/ping || exit 1
            interval: 10s
            retries: 6
            timeout: 5s
        depends_on:
            db:
                condition: service_healthy
            redis:
                condition: service_healthy
    cron:
        image: "${CONTAINER_IMAGE:-pilos/pilos:latest}"
        <<: *pilos-common
        entrypoint: ["pilos-cli", "run:cron"]
        depends_on:
            app:
                condition: service_healthy
    horizon:
        image: "${CONTAINER_IMAGE:-pilos/pilos:latest}"
        <<: *pilos-common
        entrypoint: ["pilos-cli", "run:horizon"]
        depends_on:
            app:
                condition: service_healthy
```

Next define the container used by docker compose in the `.env` file:

```bash
CONTAINER_IMAGE=pilos/pilos:4.0.0-beta.1
```

## .env option changes

### New default values

| Option          | Old Default | New Default | Description                                                                                            |
| --------------- | ----------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| `DB_CONNECTION` | `mysql`     | `mariadb`   | Database connection driver<br/>Explicitly set to mariadb to support db specific features in the future |
| `MAIL_HOST`     | `mailhog`   | `mailpit`   | [DEV ONLY] Replaced default local mail server                                                          |

### Renamed options

Many .env options that were only used during initial setup, as the values were stored in the database.
Some basic application settings have been renamed to better reflect their purpose.

| Old Option Name      | New Option Name              | Description |
| -------------------- | ---------------------------- | ----------- |
| `HELP_URL`           | `DEFAULT_HELP_URL`           |             |
| `LEGAL_NOTICE_URL`   | `DEFAULT_LEGAL_NOTICE_URL`   |             |
| `PRIVACY_POLICY_URL` | `DEFAULT_PRIVACY_POLICY_URL` |             |

### Removed options

Many .env options that were only used during initial setup, as the values were stored in the database.
As most advanced options names did not reflect their actual purpose, they have been removed to simplify the setup process and reduce the number of options in the .env file.
The values can be adjusted in the admin UI.

The new default values are only used for new installations.
Existing installations will keep their current values as they are stored in the database.

| Option                                 | Old Default        | New Default      | Upgrade steps                                                                                                                                                           |
| -------------------------------------- | ------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OWN_ROOMS_PAGINATION_PAGE_SIZE`       | `5`                | _REMOVED_        | Client selects the optimum value for the given device size                                                                                                              |
| `DEFAULT_PAGINATION_PAGE_SIZE`         | `15`               | `20`             |                                                                                                                                                                         |
| `STATISTICS_SERVERS_ENABLED`           | `false`            | _enabled_        |                                                                                                                                                                         |
| `STATISTICS_SERVERS_RETENTION_PERIOD`  | `90` (_90 days_)   | _60 days_        |                                                                                                                                                                         |
| `STATISTICS_MEETINGS_ENABLED`          | `false`            | _enabled_        |                                                                                                                                                                         |
| `STATISTICS_MEETINGS_RETENTION_PERIOD` | `30` (_30 days_)   | _30 days_        |                                                                                                                                                                         |
| `ATTENDANCE_ENABLED`                   | `false`            | _REMOVED_        | Attendance logging can be controlled by the room type setting.<br/>To disable attendance logging enforce 'Log attendance of participants' to disabled in all room types |
| `ATTENDANCE_RETENTION_PERIOD`          | `14` (_14 days_)   | `14` (_14 days_) |                                                                                                                                                                         |
| `PASSWORD_CHANGE_ALLOWED`              | `true`             | `true`           |                                                                                                                                                                         |
| `ROOM_TOKEN_EXPIRATION`                | `-1` (_disabled_)  | _90 days_        |                                                                                                                                                                         |
| `DEFAULT_ROOM_LIMIT`                   | `-1` (_unlimited_) | _unlimited_      |                                                                                                                                                                         |
| `ROOM_AUTO_DELETE_ENABLED`             | `false`            | _REMOVED_        | Can be disabled by setting the inactive-perdiod and never-used-perdiod to unlimited                                                                                     |
| `ROOM_AUTO_DELETE_INACTIVE_PERIOD`     | `365` (_365 days_) | _unlimited_      |                                                                                                                                                                         |
| `ROOM_AUTO_DELETE_NEVER_USED_PERIOD`   | `90` (_90 days_)   | _unlimited_      |                                                                                                                                                                         |
| `ROOM_AUTO_DELETE_DEADLINE_PERIOD`     | `14` (_14 days_)   | _14 days_        |                                                                                                                                                                         |
| `CACHE_DRIVER`                         | `file`             | _REMOVED_        | Removed as setup with redis is new default and highly recommended                                                                                                       |
| `QUEUE_CONNECTION`                     | `sync`             | _REMOVED_        | Removed as setup with redis is new default and highly recommended                                                                                                       |
| `MAIL_ENCRYPTION`                      | `null`             | _REMOVED_        | Removed by the laravel framework; use `MAIL_SCHEME` instead (See [Configuration](./03-configuration.md#email-configuration))                                            |

## User Interface

The UI framework was changed from BootstrapVue to PrimeVue.
This required a complete rebuild of the frontend, providing an opportunity to redesign the entire UI.
The goal was to make the UI more user-friendly and modern.
To achieve this, a single room overview page was created to simplify finding individual and other people's rooms.
The previous 'Find rooms'/'All rooms' page has been integrated into the new 'Rooms' page.

Additionally, many advanced room settings were moved into an expert mode to reduce complexity for the average user while giving administrators more control over default settings.
Users can still override these settings if allowed by the administrator.
The room type selection and the process for changing room types were redesigned to clarify the differences between them.
To facilitate users in selecting the appropriate room type, an option was added to set a description for each room type, allowing administrators to explain the differences in natural language.

### Theme

Custom theming via SASS files has been removed. Instead, you can dynamically change the base color and toggle the rounded corners in the admin interface.
Users can also choose between light and dark mode, so a new option for a dark logo and a favicon version has been introduced.

### Locales

Many translations have been added, moved and changed. Please check the `resources/lang` folder for new translations and adjust your custom translations accordingly.

## Redis

In v4, Redis is used as the default caching and queuing driver to allow multi-node setups.
You need to update your docker compose setup to include the Redis service or use an [external Redis server](https://thm-health.github.io/PILOS/docs/administration/configuration#redis-configuration).

### Adding Redis service to docker compose

Add the following service to your `docker-compose.yml` file:

```yaml
redis:
    image: redis:7.2-alpine3.18
    restart: unless-stopped
    volumes:
        - ./redis/data:/data
    healthcheck:
        test: ["CMD-SHELL", "redis-cli ping | grep PONG"]
        interval: 5s
        retries: 12
        timeout: 5s
```

Next you need to set the hostname of the Redis server in the `.env` file:

```bash
# Redis config (see config/database.php for more options)
REDIS_HOST=redis
```

### Remove .env option

The default values for `CACHE_DRIVER` and `QUEUE_CONNECTION` are set to `redis`.
Remove the options from your `.env` file to use Redis as the cache and queue driver.

As an alternative update the `.env` file to use Redis as the cache and queue driver:

```bash
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
```

## Database

### MariaDB

In v4, the MariaDB version has been bumped to 11.
All new installations will use this version, existing installations will not be automatically upgraded.

#### Upgrade MariaDB container (optional)

To upgrade your MariaDB container, you need to edit your `docker-compose.yml` file:

- Change the MariaDB image tag to `11`.
- Add a new environment variable `MARIADB_AUTO_UPGRADE` to trigger the service to upgrade the database:

    ```yaml
    db:
        image: "mariadb:11"
        environment:
            MARIADB_AUTO_UPGRADE: 1
    ```

### Database schema changes

The database schema has changed quite a lot from v2/3 to v4.
This was necessary for many new features and a more stable global application settings storage.

The database cannot be migrated automatically, as we have rewritten the whole database migration.
To disable the automatic database migration, set the `.env` variable `RUN_MIGRATIONS=false`.

We try to migrate all old settings to new storage as good as possible, but some settings may be lost if they are not used anymore or the old option is not available in the new version.
Please check the settings in the admin UI after the migration.

## Finish the upgrade

1. Start the new version of PILOS
    ```bash
    docker compose up -d
    ```
2. Run the command to upgrade the database schema
    ```bash
    docker compose exec app pilos-cli db:upgrade
    ```

### Cleanup

To revert the changes made for the upgrade process, please follow these steps:

1. Re-enable the automatic database migration by setting the `.env` variable `RUN_MIGRATIONS=true` or remove the variable.
2. If you changed the MariaDB version, also remove the `MARIADB_AUTO_UPGRADE` environment variable from the MariaDB service in your `docker-compose.yml` file.
