---
title: Getting Started
---

# Getting Started

To make installing PILOS easy, we provide a Docker image.
The application will be installed with some default settings, but you can customize it later via the UI, config files and overriding some files.

## Requirements
- fully qualified hostname
- valid SSL certificate (HTTPS)
- reverse proxy, e.g. apache or nginx
- Docker and [Compose plugin](https://docs.docker.com/compose/install/linux/)

## Docker Tags
We use [Semantic Versioning](https://semver.org/spec/v2.0.0.html) for our releases and tag the images accordingly.

It is **recommended** to use the image with the latest major version e.g. `v1.9.5` -> `v1` to always get the latest features and bugfixes.

**[All Tags](https://hub.docker.com/r/pilos/pilos/tags)**

### Development Images
Additionally, we provide images for the latest commit on the `master` and the release branches, e.g. `dev-v1`.

### Latest
We **don't** recommend using the `latest` tag for production, as breaking changes can cause you some trouble.
**Always** check the changelog before changing the major version!

## Installing PILOS
Create a directory for the data and config of PILOS
```bash
mkdir pilos && cd pilos
```

To make the following steps independent to docker image changes, we define an environment variable.
Adjust the docker image tag according to the version you want to use (see [Docker Tags](#docker-tags) section).
```bash
export IMAGE="pilos/pilos:latest"
```

Next we need the `docker-compose.yml` and `.env` files. They can be copied from the image to your host.
```bash
docker run --rm $IMAGE cat ./.env.example > .env
docker run --rm $IMAGE cat ./docker-compose.yml > docker-compose.yml
sed -i "s|CONTAINER_IMAGE=.*|CONTAINER_IMAGE=$IMAGE|g" .env
```

## Configuring PILOS
In the `.env` file all application settings can be found, some of them can be changed with the UI.

### App-Key
We need to set the `APP_KEY` option in the `.env` file, as this is used to encrypt sessions, cookies, urls, etc.
Using the following command a secure key is generated:
```bash
docker run --rm  --entrypoint pilos-cli $IMAGE key:generate --show
```
Copy the output and edit the `APP_KEY` option in the `.env` file.

**Example**: `APP_KEY=base64:WJKM8YsGNutfcc3+2q/xiWE9Sus8GcbNVvTKFgdYgPw=`

### Host
You also need to edit the `APP_URL` option in the `.env` file to match the domain from which the application will be accessible from.

**Example**: `APP_URL=https://pilos.example.com`

## Database
The default docker compose setup contains a [MariaDB](https://mariadb.org/).

To create a secure default database password, run the following command:
```bash
openssl rand -hex 24
```
Copy the output and edit the `DB_PASSWORD` option in the `.env` file.

**Example**: `DB_PASSWORD=44cefe1bc30ddf6bd2013a97f58353acb5e9000e7ec3bb90`


### Using PostgreSQL
You can also use PostgreSQL as an alternative database since PILOS v2.

**Please note:** We do NOT support migrating from v1.

To run a local PostgreSQL using docker compose, you have to adjust the `docker-compose.yml` file:
```yml
    db:
      image: postgres:14.6-alpine3.17
      container_name: postgres
      restart: unless-stopped
      volumes:
        - ./db:/var/lib/postgresql/data
      environment:
        POSTGRES_USER: '${DB_USERNAME}'
        POSTGRES_PASSWORD: '${DB_PASSWORD}'
        POSTGRES_DB: '${DB_DATABASE}'
      healthcheck:
        test: ["CMD-SHELL", "pg_isready"]
        retries: 3
        timeout: 5s
```

To use a different database adjust the `.env` file:

```shell
# Database config
DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
```

## Webserver
PILOS has a build in nginx webserver. However, it is **highly** recommended to not expose the container port.
You will need to set up a reverse proxy that routes the traffic to this application (default: 127.0.0.1:5000)


### Nginx (Recommended)

```nginx
location / {
  proxy_pass          http://127.0.0.1:5000;
  proxy_set_header    Host              $host;
  proxy_set_header    X-Forwarded-Port  $server_port;
  proxy_set_header    X-Forwarded-For   $proxy_add_x_forwarded_for;
  proxy_set_header    X-Forwarded-Proto $scheme;
  proxy_http_version  1.1;
}
```

#### Rate limiting
PILOS has a build in rate limiting, but you can also set some additional rate limiting on the webserver level.
This example config allows 5 requests/sec. The configuration allows bursts of up to 20 requests, the first 10 of which are processed without delay. A delay is added after 10 excessive requests to enforce the 5 r/s limit. After 20 excessive requests, any further requests are rejected. For more details have a look at the nginx documentation on [rate limting](https://www.nginx.com/blog/rate-limiting-nginx/).

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;
location / {
  limit_req zone=api burst=20 delay=10;
  limit_req_log_level warn;
  limit_req_status 429;

  proxy_pass          http://127.0.0.1:5000;
  proxy_set_header    Host              $host;
  proxy_set_header    X-Forwarded-Port  $server_port;
  proxy_set_header    X-Forwarded-For   $proxy_add_x_forwarded_for;
  proxy_set_header    X-Forwarded-Proto $scheme;
  proxy_http_version  1.1;
}
```

### Apache
```apacheconf
ProxyPreserveHost On

ProxyPass "/"  "http://127.0.0.1:5000/"
ProxyPassReverse "/"  "http://127.0.0.1:5000/"

RequestHeader set X-Forwarded-Proto "https"
RequestHeader set X-Forwarded-Port "443"
```

You may need to adjust the X-Forwarded-Proto and X-Forwarded-Port settings, depending on your environment.

### Trusted proxies
You have to add your proxy to the list of trusted proxies in the `.env` file.
```shell
# Trusted proxies for reverse proxy setups
# You can use "*" to trust all proxies that connect directly to the server
# or you can use a comma separated list of trusted proxies, also with support for CIDR notation e.g. "192.0.0.1,10.0.0.0/8"
TRUSTED_PROXIES=
```

## Starting
To start the application and database run:
```bash
docker compose up -d
```

You can monitor the startup with:
```bash
docker compose logs -f
```

**Notice:** If you modify the `.env` file you need to restart the container.

## Creating a superuser
The first superuser can be created by running the following command:
```bash
docker compose exec app pilos-cli users:create:superuser
```

## Logging

By default all nginx and php-fpm errors are written to stderr and shown in the docker logs. The application messages and errors are also written to stderr.

### File based logging
To use a more persistent logging exclusive for the application, change the `LOG_CHANNEL` in the `.env` file to `stack` (a single file) or `daily` (log rotation)
and mount the directory `storage/logs` to the host by adding the following line to the `docker-compose.yml` file:
```yml
x-docker-pilos-common: &pilos-common
    env_file: .env
    volumes:
        - './storage/logs:/var/www/html/storage/logs'
```
