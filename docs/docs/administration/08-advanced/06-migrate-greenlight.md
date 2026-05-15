---
title: Migrate from Greenlight
description: Step by step guide to migrate from Greenlight to PILOS
---

PILOS provides an easy-to-use command to import all Greenlight users (incl. ldap), rooms (incl. default presentation) and shared accesses.

## Preparing migration from other host

If you plan to run PILOS on a different host than Greenlight, you have to adjust the docker-compose.yml inside the Greenlight directory
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

If you want to import Room presentations, copy Greenlight's active storage directory to the PILOS app storage at `/storage/app/migration/presentations` and specify `--presentation-path=migration/presentations` at the command line.
Successfully imported presentation files will be copied to a different location.

## Running migration command

The command will output the process of the import and informs about failed user, room, room presentation and shared access import.

**Note** If a room with the same room id already exists in PILOS it will NOT be imported and its default presentation and shared accesses are ignored.

### Greenlight 2

```text
Usage:
  import:greenlight-v2 <host> <port> <database> <username> <password>

Arguments:
  host                  ip or hostname of postgres database server
  port                  port of postgres database server
  database              Greenlight database name, see Greenlight .env variable DB_NAME
  username              Greenlight database username, see Greenlight .env variable DB_USERNAME
  password              Greenlight database password, see Greenlight .env variable DB_PASSWORD

Options:
      --no-confirm                             do not ask if the import should be committed
      --default-role[=DEFAULT-ROLE]            name of the default role for imported local users (case-insensitive)
      --room-prefix[=ROOM-PREFIX]              prefix for imported room names (empty string is allowed)
      --room-type[=ROOM-TYPE]                  name of the room type for imported rooms
      --presentation-path[=PRESENTATION-PATH]  path to room presentations, relative to /storage/app
      --auth-provider-map[=AUTH-PROVIDER-MAP]  JSON mapping of user authentication providers (Greenlight => PILOS)
```

**Example**

```bash
docker compose exec app \
    pilos-cli import:greenlight-v2 \
    localhost \
    5432 \
    greenlight_production \
    postgres \
    12345678
```

**Example (non-interactive)**

```bash
docker compose exec app \
    pilos-cli import:greenlight-v2 \
    --no-confirm \
    --default-role=User \
    --room-prefix='' \
    --room-type=Meeting \
    --presentation-path=migration/presentations \
    --auth-provider-map='{"shibboleth":"shibboleth","google":"oidc"}' \
    localhost \
    5432 \
    greenlight_production \
    postgres \
    12345678
```

### Greenlight v3

```text
Usage:
  import:greenlight-v3 [options] [--] <host> <port> <database> <username> <password>

Arguments:
  host                                         ip or hostname of postgres database server
  port                                         port of postgres database server
  database                                     Greenlight database name
  username                                     Greenlight database username
  password                                     Greenlight database password

Options:
      --no-confirm                             do not ask if the import should be committed
      --default-role[=DEFAULT-ROLE]            name of the default role for imported local users (case-insensitive)
      --room-prefix[=ROOM-PREFIX]              prefix for imported room names (empty string is allowed)
      --room-type[=ROOM-TYPE]                  name of the room type for imported rooms (case-insensitive)
      --presentation-path[=PRESENTATION-PATH]  path to room presentations, relative to /storage/app
```

**Example**

```bash
docker compose exec app pilos-cli import:greenlight-v3 \
    localhost \
    5432 \
    greenlight-v3-production \
    postgres \
    12345678
```

**Example (non-interactive)**

```bash
docker compose exec app pilos-cli import:greenlight-v3 \
    --no-confirm \
    --default-role=User \
    --room-prefix='' \
    --room-type=Meeting \
    --presentation-path=migration/presentations \
    localhost \
    5432 \
    greenlight-v3-production \
    postgres \
    12345678
```

## Importing recordings

You can also import recordings for existing rooms. To make this possible the import command creates a meeting with the BBB meeting ID for every
imported room. This meeting does not have a start- or end timestamp, so it is not visible in the frontend but associated recordings _will_ be listed.

To import existing recordings, you have to

1. find the meeting ID (column `bbb_id` (GL2) or `meeting_id` (GL3) in the `rooms` table)
2. find all recordings with this meeting ID (XPath: `/recording/meta/meetingId` in metadata.xml)
3. pack matching recordings into tar files and
4. move or copy those tar files to PILOS' `recordings-spool` directory.

Existing recordings prepared like this will be imported just like new ones would.

Imported recordings will be visible only to room owners, who may of course change this, if they so choose. If you want imported recordings to be
visible to everyone, put them in a subfolder `public` in the `recordings-spool` directory.

**Note** You _may_ have to temporarily increase RAM allocated to horizon if it is limited.

**Note** YMMV, depending on your BBB loadbalancer. If, for example, you run b3scale, you need to extract the "simple" Greenlight meeting ID from the
more complex b3scale meeting ID.

## Adjust nginx

### PILOS is running on the same host

To use PILOS as a drop-in replacement for Greenlight 2 or Greenlight 3, remove all greenlight related nginx configuration
and run PILOS on the same host following the instructions in the [getting started guide](../02-getting-started.md).

### Greenlight 2: PILOS is running on a different host

Please replace the following section of the Greenlight nginx configuration:

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

This will redirect all traffic to PILOS. If you don't use the /b base path for Greenlight adjust the code accordingly.
Replace **DOMAIN.TLD** with the hostname of your PILOS installation.

### Greenlight 3: PILOS is running on a different host

Replace the content of the file
`/etc/greenlight/nginx/greenlight-v3.nginx` (Greenlight Standalone) or
`/usr/share/bigbluebutton/nginx/greenlight-v3.nginx` (Greenlight part of BigBlueButton)
with

```nginx
location @bbb-fe {
    return 301 https://DOMAIN.TLD$request_uri;
}
```

This will redirect all traffic to PILOS. Replace **DOMAIN.TLD** with the hostname of your PILOS installation.

## Enable Greenlight compatibility mode

To enable support for the most common Greenlight URLs set the following .env variable

```dotenv
GREENLIGHT_COMPATIBILITY=true
```

If your Greenlight was running in a subdirectory (Greeenlight 2 is running in `/b` by default) adjust the .env variable. Do not include the slash `/`.

```dotenv
GREENLIGHT_PATH=b
```

**Note** We don't support Greenlight compatibility mode for Greenlight 2 installations without a prefix like /b.
You also need to make sure the prefix does not collide with PILOS URLs (check routes in: routes/api.php, routes/web.php and resources/js/router.js )

## Shutdown Greenlight

To shutdown Greenlight run this command inside the Greenlight directory

```bash
docker-compose down
```
