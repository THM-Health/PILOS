---
title: Scaling
description: Guides on how to scale PILOS vertically and horizontally
---

# Scaling PILOS

**Before continuing, make sure you have read the [installation instructions](../02-getting-started.md), as this document will only cover some additional scaling related topics.**

## Vertical Scaling

You can try to scale the PILOS docker container vertically by increasing the PHP and nginx worker processes.

### PHP

To increase the number of PHP-FPM worker processes you can set the environment variable `PHP_FPM_PM_MAX_CHILDREN` to the desired value.

```shell
PHP_FPM_PM_MAX_CHILDREN=100
```

### Nginx

To increase the number of nginx worker processes you can set the environment variable `NGINX_WORKER_PROCESSES` to the desired value.
Usually you should set this to the number of CPU cores available, using `auto` as the value will do this automatically.

```shell
NGINX_WORKER_PROCESSES=auto
```

Each nginx worker process can handle multiple connections.
The maximum amount of connections is defined by the `NGINX_WORKER_CONNECTIONS` environment variable.

```shell
NGINX_WORKER_CONNECTIONS=1024
```

During each connection nginx will need up to two file descriptors.
If you increase the number of worker connections you should also increase the maximum number of open files to at least twice the amount.

```shell
NGINX_WORKER_RLIMIT_NOFILE=2048
```

## Horizontal Scaling

In addition to vertical scaling you can also scale PILOS horizontally by running multiple instances of the PILOS docker container.
However, you need a use a shared database, redis and storage as shown in the following diagram:

![PILOS Scaling](https://github.com/THM-Health/PILOS/assets/4281791/869ddf56-5371-4807-8b63-ffb1682e0676)

### Load Balancing

The PILOS docker container has a build in nginx webserver to serve static files and proxy all other requests to PHP-FPM.

You should always use another webserver in front of the PILOS docker container to handle the SSL encryption.
Have a look at our [install instructions](../02-getting-started.md#webserver) how to set up apache or nginx as a reverse proxy.

The shibboleth authentication is _only_ available if the reverse proxy is apache with mod_shib. ([How to configure](./01-external-authentication.md#shibboleth))

### Database

You need a dedicated MySQL/MariaDB or PostgreSQL database for PILOS.
The database credentials are stored in the `.env` file.

**MariaDb Example:**

```shell
# Database config
DB_CONNECTION=mariadb
DB_HOST=db.example.com
DB_PORT=3306
DB_DATABASE=test
DB_USERNAME=user
DB_PASSWORD=password
```

**PostgreSQL Example:**

```shell
# Database config
DB_CONNECTION=pgsql
DB_HOST=db.example.com
DB_PORT=5432
DB_DATABASE=test
DB_USERNAME=user
DB_PASSWORD=password
```

### Redis

For caching and queueing PILOS uses a Redis server.
The Redis credentials are stored in the `.env` file.

**Example:**

```.shell
# Redis config
#REDIS_URL=
REDIS_HOST=redis
#REDIS_USERNAME=null
#REDIS_PASSWORD=null
#REDIS_PORT=6379
#REDIS_DB=0
#REDIS_CACHE_DB=1
```

## Container initialization

# Fix permissions

During startup of the container permissions of the following folders are automatically fixed:

- /var/www/html/resources/custom
- /var/www/html/storage/app
- /var/www/html/storage/recordings
- /var/www/html/storage/logs
- /var/www/html/public/build

For convenience reasons this is enabled by default, however with a large number of files this can slow down the container startup.

This script can also be executed manually by running `pilos-cli fix-permissions`.

You can disable this script by setting the environment variable `RUN_FIX_PERMISSIONS=false`.

### Initialization script

During startup of the container an initialization script is executed.
This script can also be executed manually by running `pilos-cli init`.
You can also disable the initialization by setting the environment variable `RUN_INIT=false`.

The following steps are executed during the initialization:

- Build frontend
- Optimize application by caching config, routes, views, locales, etc.

### Database migration

After the initialization the database migration is executed.
To disable the automatic database migration set the environment variable `RUN_MIGRATIONS=false`.
