---
title: Getting Started
---

# Getting Started

To make installing PILOS easy, we provide a Docker image.
The application will be installed with some default settings, but you can customize it later via the UI, config files and overriding some files.

## Requirements

-   fully qualified hostname
-   valid SSL certificate (HTTPS)
-   reverse proxy, e.g. apache or nginx
-   Docker and [Compose plugin](https://docs.docker.com/compose/install/linux/)

## Docker Tags

We use [Semantic Versioning](https://semver.org/spec/v2.0.0.html) for our releases and tag the images accordingly.

It is **recommended** to use the image with the latest major version e.g. `v4.1.0` -> `v4` to always get the latest features and bugfixes.

**[All Tags](https://hub.docker.com/r/pilos/pilos/tags)**

### Development Images

Additionally, we provide images for the latest commit on the `develop` branch (`dev-develop`) and the release branches, e.g. `dev-v4.x`.

### Latest

**Never** use the `latest` tag for production, as upgrades between major versions is not supported.
**Always** check the changelog and upgrade documentation before changing the major version!

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
        POSTGRES_USER: "${DB_USERNAME}"
        POSTGRES_PASSWORD: "${DB_PASSWORD}"
        POSTGRES_DB: "${DB_DATABASE}"
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

PILOS has a build in nginx webserver. However, it is **highly** recommended to not expose the container port to the public.
You will need to set up a reverse proxy that routes the traffic to this application (default: 127.0.0.1:5000)

### Nginx (Recommended)

```nginx
location / {
  proxy_pass          http://127.0.0.1:5000;
  proxy_set_header    X-Forwarded-Host $host;
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
  proxy_set_header    X-Forwarded-Host $host;
  proxy_set_header    X-Forwarded-Port  $server_port;
  proxy_set_header    X-Forwarded-For   $proxy_add_x_forwarded_for;
  proxy_set_header    X-Forwarded-Proto $scheme;
  proxy_http_version  1.1;
}
```

### Apache

```apacheconf
ProxyPreserveHost On

ProxyPass "/"  "http://127.0.0.1:5000/" nocanon
ProxyPassReverse "/"  "http://127.0.0.1:5000/"

RequestHeader set X-Forwarded-Proto "https"
RequestHeader set X-Forwarded-Port "443"
```

You may need to adjust the X-Forwarded-Proto and X-Forwarded-Port settings, depending on your environment.

### Trusted proxies

By default, the application uses the requesting IP for logging and rate limiting.
It also uses the requests host, port and protocol to generate URLs and links.

By running a reverse proxy in front of the application, the requesting IP will be the IP of the reverse proxy.
As the ssl termination is done on the reverse proxy, the application will also not know if the request was made via https or http and on which port.
Therefore, reverse proxies need to forward this information in a header (e.g. `X-Forwarded-For`).
PILOS will use the following headers if the request comes from a trusted proxy and use them instead of the requests IP address, host, port and protocol:

-   `X-Forwarded-For` (Real client IP)
-   `X-Forwarded-Host` (Public hostname of the application)
-   `X-Forwarded-Port` (Public port of the application)
-   `X-Forwarded-Proto` (Public protocol of the application)

**Warning** Make sure all these headers are set by the reverse proxy, otherwise an attacker might be able to pass fake headers trough a trusted proxy to the application.

To prevent attackers from sending fake headers, the application needs to know which proxies are trustworthy.

#### Reverse proxy on the same host (Default)

If your reverse proxy is running on the same host as your application you should not expose the application port to the public (default 127.0.0.1:5000).
As the traffic is going through the reverse proxy via the docker bridge network to the container the requesting IP will be the IP of the reverse proxy inside the docker network.
This local IP cannot be predicted and therefore the application needs to trust all proxies.
This will allow the application to use the headers from the reverse proxy.

```shell
TRUSTED_PROXIES=*
```

#### Reverse proxy on a different host

If your reverse proxy is on a different host in your local network, and you expose the application port, the requesting IP will be the IP of the reverse proxy.
The application can then validate the IP address of the reverse proxy and trust it. This should prevent other users in you local network from spoofing the IP address by sending requests with a fake `X-Forwarded-For` header.

You can specify the IP address of the reverse proxy or a subnet of trusted IP addresses:

```shell
TRUSTED_PROXIES=127.0.0.1,10.0.0.0/8
```

If you don't know the IP address of the reverse proxy you also can use the wildcard `*` to trust all proxies. **Warning:** Setting `TRUSTED_PROXIES=*` can pose a security risk, as it allows attackers to spoof their true IP address and other information.
You therefore need to make sure only traffic from the reverse proxy can reach the application, e.g. by using a firewall.

**Warning:** If your reverse proxy is on a different host and therefore the ssl termination is done on the reverse proxy, all traffic between the reverse proxy and the application is unencrypted.

You can learn more on the topic in the [Laravel documentation](https://laravel.com/docs/11.x/requests#configuring-trusted-proxies) and [Symfony documentation](https://symfony.com/doc/current/deployment/proxies.html).

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
        - "./storage/logs:/var/www/html/storage/logs"
```

## Monitoring

PILOS comes with a user interface for monitoring the application, server and queue workers. Administrators can access the monitoring UI via the 'System Monitoring' menu item.
The php-fpm status page is available from container port 81 and the url `/status`.

You can forward the port to the host by adding the following line to the `docker-compose.yml` file for the app service:

```yml
ports:
    - "127.0.0.1:9000:81"
```

### Prometheus + Grafana

If you like to monitor php-fpm using prometheus and grafana, you can use the [hipages/php-fpm_exporter:latest](https://github.com/hipages/php-fpm_exporter) container.
Add the following service to the `docker-compose.yml` file:

```yml
monitor:
    image: hipages/php-fpm_exporter:latest
    restart: always
    ports:
        - "127.0.0.1:9253:9253"
    command: "--phpfpm.scrape-uri=tcp://app:81/status"
```

You can configure a reverse proxy to expose the container to the public, add password protection, configure prometheus and grafana to scrape the metrics and create dashboards.
