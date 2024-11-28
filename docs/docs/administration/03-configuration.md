---
title: Configuration
---

## Application Configuration

| Option      | Default Value      | Description                                                                                         |
| ----------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| `APP_NAME`  | `PILOS`            | Name of the application shown in page title, messages, emails, etc.                                 |
| `APP_ENV`   | `production`       | Application environment (`local` or `production`).                                                  |
| `APP_KEY`   |                    | Encryption key for the application.                                                                 |
| `APP_DEBUG` | `false`            | Enable/disable debug mode.<br/>May contain sensitive information (do **not** enable in production!) |
| `APP_URL`   | `http://localhost` | Application URL. Should be http://                                                                  |

## Container Configuration

| Option            | Default Value        | Description                                                            |
| ----------------- | -------------------- | ---------------------------------------------------------------------- |
| `CONTAINER_IMAGE` | `pilos/pilos:latest` | Docker container image for the application.<br/>Used by docker compose |

## Session Configuration

| Option             | Default Value | Description                  |
| ------------------ | ------------- | ---------------------------- |
| `SESSION_LIFETIME` | `120`         | Session lifetime in minutes. |

## Logging Configuration

| Option        | Default Value | Description                                   |
| ------------- | ------------- | --------------------------------------------- |
| `LOG_CHANNEL` | `stderr`      | Logging channel (`stderr`, `stack`, `daily`). |
| `LOG_LEVEL`   | `debug`       | Log level (`debug`, `info`, `notice`, etc.).  |

For more information on logging, have a look at the [Getting started](./02-getting-started.md#logging) guide.

## Database Configuration

| Option          | Default Value | Description                                                                                                                               |
| --------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `DB_CONNECTION` | `mariadb`     | Database connection driver.                                                                                                               |
| `DB_HOST`       | `db`          | Database host<br/>Default is the docker compose service                                                                                   |
| `DB_PORT`       | `3306`        | Database port.                                                                                                                            |
| `DB_DATABASE`   | `app`         | Database name                                                                                                                             |
| `DB_USERNAME`   | `user`        | Database username.                                                                                                                        |
| `DB_PASSWORD`   | `password`    | Database password<br/>Default should be replaced with random value during setup (see [Getting Started](./02-getting-started.md#database)) |

This default configuration used the MariaDB database of the docker compose setup.
However, you can also use an external database.

If you want to use PostgreSQL, have a look at the [Getting started](./02-getting-started.md#using-postgresql) guide.

## Redis Configuration

| Option       | Default Value | Description        |
| ------------ | ------------- | ------------------ |
| `REDIS_HOST` | `redis`       | Redis server host. |

This default configuration uses the Redis server of the docker compose setup.
However, you can also use an external Redis server.

### Additional Redis Configuration

If you use an external Redis server, you may need to configure additional options.

| Option           | Default Value | Description                                |
| ---------------- | ------------- | ------------------------------------------ |
| `REDIS_SCHEME`   | `tcp`         | Redis connection scheme. (`tcp` or `tls`)  |
| `REDIS_PORT`     | `6379`        | Redis server port.                         |
| `REDIS_USERNAME` | `null`        | Redis server username (REDIS ACL system).  |
| `REDIS_PASSWORD` | `null`        | Redis server password (if required).       |
| `REDIS_DATABASE` | `0`           | Redis database number for the application. |
| `REDIS_CACHE_DB` | `1`           | Redis database number for caching.         |

## Email Configuration

| Option              | Default Value      | Description                                                                               |
| ------------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| `MAIL_MAILER`       | `smtp`             | Mail driver (`smtp`).                                                                     |
| `MAIL_HOST`         | `mailpit`          | Mail server hostname<br/>Default is local dev. mail server (only available in dev. setup) |
| `MAIL_PORT`         | `1025`             | Mail server smtp port.                                                                    |
| `MAIL_USERNAME`     | `null`             | Mail username (if required).                                                              |
| `MAIL_PASSWORD`     | `null`             | Mail password (if required).                                                              |
| `MAIL_ENCRYPTION`   | `null`             | Mail encryption method (`ssl`, `tls`, `null`).                                            |
| `MAIL_FROM_ADDRESS` | `admin@domain.tld` | Sender email address.                                                                     |
| `MAIL_FROM_NAME`    | `${APP_NAME}`      | Sender name (uses `APP_NAME`).                                                            |

This default configuration uses the Mailpit mail server of the docker compose development setup.
It is a mail testing tool that captures emails sent by the application.

You need to configure a real mail server for production use.

:::tip

To check your email configuration, you can send a test mail using the following command:

```bash
docker compose exec app pilos-cli mail:test
```

:::

## Authentication

| Option               | Default Value | Description                  |
| -------------------- | ------------- | ---------------------------- |
| `LOCAL_AUTH_ENABLED` | `true`        | Enable local authentication. |

To enable external authentication methods like LDAP, please refer to the [External Authentication](./08-advanced/01-external-authentication.md) guide.

## User Interface and Localization Configuration

| Option            | Default Value | Description                                                                                                  |
| ----------------- | ------------- | ------------------------------------------------------------------------------------------------------------ |
| `ENABLED_LOCALES` |               | Comma-separated list of enabled locales.<br/>By default all all locales in the `lang` directory are enabled  |
| `DEFAULT_LOCALE`  | `en`          | Default locale for the application.                                                                          |
| `WHITELABEL`      | `false`       | Do not show link to PILOS Github Project in the footer.<br/>Please keep it disabled to support this project. |

## Room and Meeting Configuration

| Option                  | Default Value | Description                                             |
| ----------------------- | ------------- | ------------------------------------------------------- |
| `WELCOME_MESSAGE_LIMIT` | `500`         | Maximum length of room welcome message. (max. 5000)     |
| `ROOM_NAME_LIMIT`       | `50`          | Maximum length of room name.                            |
| `ROOM_REFRESH_RATE`     | `5`           | Base time in seconds to automatically reload room page. |
| `USER_SEARCH_LIMIT`     | `10`          | Maximum amount of users to be shown in user search      |

## BigBlueButton Configuration

| Option                         | Default Value                                                                                             | Description                                                                                                                                                                                                                                                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BBB_SERVER_CONNECT_TIMEOUT`   | `20`                                                                                                      | Maximum time to wait to establish a connection to the BigBlueButton server.                                                                                                                                                                                                                                                   |
| `BBB_SERVER_TIMEOUT`           | `10`                                                                                                      | Maximum time to wait for a response of BigBlueButton server, once the connection has been established.                                                                                                                                                                                                                        |
| `BBB_SERVER_ONLINE_THRESHOLD`  | `3`                                                                                                       | Amount of successfully requests to a server in a row to become `online`                                                                                                                                                                                                                                                       |
| `BBB_SERVER_OFFLINE_THRESHOLD` | `3`                                                                                                       | Amount of failed requests to become `offline`.                                                                                                                                                                                                                                                                                |
| `BBB_LOAD_MIN_USER_INTERVAL`   | `15`                                                                                                      | Duration of a meetings starting phase in which `BBB_LOAD_MIN_USER_COUNT` is used for measuring the load of a meeting                                                                                                                                                                                                          |
| `BBB_LOAD_MIN_USER_COUNT`      | `15`                                                                                                      | Min. amount of users of a meeting in the starting phase used in the LoadBalancing calculation                                                                                                                                                                                                                                 |
| `BBB_MAX_FILESIZE`             | `30`                                                                                                      | Maximum file size in MB for file upload. (Make sure your reverse proxy also supports this filesize)                                                                                                                                                                                                                           |
| `BBB_ALLOWED_FILE_MIMES`       | `pdf,doc,docx,xls,`<br/>`xlsx,ppt,pptx,txt,`<br/>`rtf,odt,ods,odp,`<br/>`odg,odc,odi,jpg,`<br/>`jpeg,png` | Comma seperated list of allowed file types for file upload.                                                                                                                                                                                                                                                                   |
| `BBB_ROOM_ID_MAX_TRIES`        | `1000`                                                                                                    | Maximum amount of tries to generate a unique room id before failing.                                                                                                                                                                                                                                                          |
| `BBB_ALLOWED_NAME_CHARACTERS`  | `\w ,.'\-+\/&()`                                                                                          | Allowed characters for user names, this default is already a large selection that is suitable for most scenarios.<br/><br/>**Be careful not to whitelist all characters** to prevent XSS attacks against unknown vulnerabilities in BigBlueButton or in Office products that may contain the name as part of the spreadsheet. |

## More config options

- [External Authentication](./08-advanced/01-external-authentication.md)
- [Recording](./08-advanced/02-recording.md)
- [Scaling](./08-advanced/03-scaling.md)
- [Greenlight Configuration](./08-advanced/04-migrate-greenlight.md)
- [Development](../development/03-configuration.md)
