---
title: PILOS CLI
---

PILOS-CLI is a command line tool to interact with the PILOS application.
It has a few special commands, but the majority of the commands are passed through to the Laravel artisan command.

## Command list

## up / down

Activate or deactivate the maintenance mode of the application.

```bash
docker compose exec app pilos-cli up
docker compose exec app pilos-cli down
```

### frontend\:build

(Re-)build the PILOS frontend within the running container.
Is automatically executed when the container is started.
Can be used to rebuild the frontend after changes to the frontend code.

```bash
docker compose exec app pilos-cli frontend:build
```

### playback-player\:build

Build the BigBlueButton recording player with the release version you want.

```bash
docker compose exec app pilos-cli playback-player:build 5.0.2
```

See [Recording](./08-advanced/03-recording.md#update-the-bigbluebutton-recording-player) for more information.

### locales\:cache

Caches all locales in the application.
Automatically executed when the container is started.

```bash
docker compose exec app pilos-cli db:check
```

### users\:create\:superuser

Creates a new superuser account.

```bash
docker compose exec app pilos-cli db:check
```

### db\:check

Test the connection to the database.

```bash
docker compose exec app pilos-cli db:check
```

### db\:migrate

Run the database migrations, should always be executed with the --seed flag to rerun the seeders.
Rerunning the seeders will not overwrite existing data, but adds new data (e.g. new permissions).

```bash
docker compose exec app pilos-cli migrate --seed
```

### db\:import

Import database dump from a file inside the container.

To restore a database dump, you can use the following commands to copy the dump into the container, clear the current database and import the dump.

The db:import command executes the `mysql` or `postgresql` by passing the database credentials from the `.env` file as arguments.
Use with special care: This is considered unsafe as the password may be visible in the process list or logs files.

```bash
docker compose cp ./db_backup.sql app:/var/www/html/db_backup.sql`
docker compose exec app pilos-cli db:wipe --force
docker compose exec app pilos-cli db:import /path/to/dump.sql
```

A more secure way is to use the `docker-compose exec` command to execute the `mysql` or `psql` command directly.

```bash
docker compose cp ./db_backup.sql app:/var/www/html/db_backup.sql`
docker compose exec app pilos-cli db:wipe --force
docker compose exec app mysql
```

Using this method you can also export the database with the `mysqldump` or `pg_dump` commands.

## More commands

To list all available artisan commands, you can run the following command:

```bash
docker compose exec app pilos-cli list
```
