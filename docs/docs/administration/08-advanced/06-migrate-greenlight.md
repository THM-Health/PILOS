---
title: Migrate from Greenlight
description: Step by step guide to migrate from Greenlight to PILOS
---

PILOS provides an easy to use command to import all greenlight users (incl. ldap), rooms and shared accesses.

## Preparing migration from other host

If you plan to run PILOS on a different host than greenlight, you have to adjust the docker-compose.yml inside the greenlight directory
to publish the database port.

Change the port configuration for the db service from:

```yml
ports:
    - 127.0.0.1:5432:5432
```

to:

```yml
ports:
    - 5432:5432
```

Also make sure the internal firewall of the OS and no external firewall is not blocking access to the port and from the host PILOS is running on.

## Running migration command

The command will output the process of the import and informs about failed user, room and shared access import.

**Note** If a room with the same room id already exists in PILOS it will NOT be imported and the shared accesses are ignored.

### Greenlight 2

```text
Usage:
  import:greenlight-v2 <host> <port> <database> <username> <password>

Arguments:
  host                  ip or hostname of postgres database server
  port                  port of postgres database server
  database              greenlight database name, see greenlight .env variable DB_NAME
  username              greenlight database username, see greenlight .env variable DB_USERNAME
  password              greenlight database password, see greenlight .env variable DB_PASSWORD
```

**Example**

```bash
docker compose exec app pilos-cli import:greenlight-v2 localhost 5432 greenlight_production postgres 12345678
```

### Greenlight 3

If you want to import Room presentations, copy Greenlight's active storage directory to the PILOS app storage at `/storage/app/migration/presentations` and specify `--presentation-path=migration/presentations` at the command line.
Successfully imported presentation files will be moved to a different location.

```text
Usage:
  import:greenlight-v3 [options] [--] <host> <port> <database> <username> <password>

Arguments:
  host                                         ip or hostname of postgres database server
  port                                         port of postgres database server
  database                                     greenlight database name
  username                                     greenlight database username
  password                                     greenlight database password

Options:
      --no-confirm                             do not ask if the import should be committed
      --default-role[=DEFAULT-ROLE]            name of the default role for imported local users (case-insensitive)
      --room-type[=ROOM-TYPE]                  name of the room type for imported rooms (case-insensitive)
      --presentation-path[=PRESENTATION-PATH]  path to room presentations, relative to /storage/app
```

**Example**

```bash
docker compose exec app pilos-cli import:greenlight-v3 \
    --no-confirm \
    --default-role=User \
    --room-type=Meeting \
    --presentation-path=migration/presentations \
    localhost \
    5432 \
    greenlight-v3-production \
    postgres \
    12345678
```

## Adjust nginx to redirect to PILOS (other host)

Please replace the following section of the greenlight nginx configuration:

```nginx
location /b {
  proxy_pass          http://127.0.0.1:5000;
  proxy_set_header    Host              $host;
  proxy_set_header    X-Forwarded-For   $proxy_add_x_forwarded_for;
  proxy_set_header    X-Forwarded-Proto $scheme;
  proxy_http_version  1.1;
}

location /b/cable {
  proxy_pass          http://127.0.0.1:5000;
  proxy_set_header    Host              $host;
  proxy_set_header    X-Forwarded-For   $proxy_add_x_forwarded_for;
  proxy_set_header    X-Forwarded-Proto $scheme;
  proxy_set_header    Upgrade           $http_upgrade;
  proxy_set_header    Connection        "Upgrade";
  proxy_http_version  1.1;
  proxy_read_timeout  6h;
  proxy_send_timeout  6h;
  client_body_timeout 6h;
  send_timeout        6h;
}

# Allow larger body size for uploading presentations
location ~ /preupload_presentation$ {
  client_max_body_size 30m;

  proxy_pass          http://127.0.0.1:5000;
  proxy_set_header    Host              $host;
  proxy_set_header    X-Forwarded-For   $proxy_add_x_forwarded_for;
  proxy_set_header    X-Forwarded-Proto $scheme;
  proxy_http_version  1.1;
}

# Only needed if using presentations and deployed at a relative root (ex "/b")
# If deploying at "/", delete the section below

location /rails/active_storage {
  return 301 /b$request_uri;
}
```

with

```nginx
location /b {
    return 301 https://DOMAIN.TLD$request_uri;
}
```

This will redirect all traffic to PILOS. If you don't use the /b base path for greenlight adjust the code accordingly.
Replace **DOMAIN.TLD** with the hostname of your PILOS installation.

## Enable greenlight compatibility mode

To enable support for the most common greenlight urls e.g. room urls, /ldap_signin, /signin and /default_room please set the following .env variable

```
GREENLIGHT_COMPATIBILITY=true
```

If your greenlight base was different than /b adjust the .env variable. Do not include the slash "/".

```
GREENLIGHT_PATH=b
```

**Note** We don't support greenlight compatibility mode for greenlight installations without a prefix like /b.
You also need to make sure the prefix does not collide with PILOS urls (check routes in: routes/api.php, routes/web.php and resources/js/router.js )

## Shutdown greenlight

To shutdown greenlight run this command inside the greenlight directory

```bash
docker-compose down
```
