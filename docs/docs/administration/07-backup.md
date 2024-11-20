---
title: Backup and Restore
---

## Introduction

This document describes a simple way to back up and restore a PILOS installation.
Make sure to use the same version of PILOS for backup and restore.

## Backup

1. **Start Maintenance Mode**
    ```bash
    docker compose exec app pilos-cli down
    ```
2. **Stop Horizon and Cron**
    ```bash
    docker compose stop cron horizon
    ```
3. **Backup the Database**

    You will need to replace `user` and `test` with the database user and database name in your `docker-compose.yml` file. When you run the command, you will be prompted for the password for the database user you specified in `docker-compose.yml`.

    ```bash
    docker compose exec db mariadb-dump -u user -p test > db_backup.sql
    ```

4. **Backup the Files**
    ```bash
    tar -czf file_backup.tar.gz storage/ app/
    ```
5. **Start Horizon and Cron**
    ```bash
    docker compose start cron horizon
    ```
6. **End Maintenance Mode**
    ```bash
    docker compose exec app pilos-cli up
    ```

## Restore

1. **Start Maintenance Mode**
    ```bash
    docker compose exec app pilos-cli down
    ```
2. **Stop Horizon and Cron**
    ```bash
    docker compose stop cron horizon
    ```
3. **Copy the Database to the Container**
    ```bash
    docker cp db_backup.sql app:/var/www/htm/db_backup.sql
    ```
4. **Restore the Database**
    ```bash
    docker compose exec app pilos-cli db:import db_backup.sql
    ```
5. **Delete Database Backup File**
    ```bash
    docker compose exec app rm db_backup.sql
    ```
6. **Restore the Files**
    ```bash
    tar -xzf file_backup.tar.gz
    ```
7. **Start Horizon and Cron**
    ```bash
    docker compose start cron horizon
    ```
8. **End Maintenance Mode**
    ```bash
    docker compose exec app pilos-cli up
    ```
