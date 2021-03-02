# Import from [greenlight](https://github.com/bigbluebutton/greenlight)

PILOS has a command line tool to import users, rooms and room shares from greenlight.

**Backup your PILOS database before running this script!**

1.  Export greenlight database tables 'users','rooms' and 'shared_accesses' to csv files with header

    The files need to be named 'users.csv', 'rooms.csv' and 'shared_accesses.csv'.

    **Example**
   
    1.  Run inside greenlight directory
    
    2.  Check the container name of the postgres database
        ```bash
        docker-compose ps
           Name                     Command              State            Ports
        -------------------------------------------------------------------------------------
        greenlight        bin/start                       Up      127.0.0.1:5000->80/tcp
        greenlight_db_1   docker-entrypoint.sh postgres   Up      127.0.0.1:5400->5432/tcp
        ```
    
    3.  Create export directory and export database (replace container name of the postgres database)
   
        ```bash
        mkdir export
        docker exec -t greenlight-db_1 psql -d greenlight_production -c "COPY public.users TO STDOUT WITH CSV HEADER" -U postgres > export/users.csv
        docker exec -t greenlight-db_1 psql -d greenlight_production -c "COPY public.rooms TO STDOUT WITH CSV HEADER" -U postgres > export/rooms.csv
        docker exec -t greenlight-db_1 psql -d greenlight_production -c "COPY public.shared_accesses TO STDOUT WITH CSV HEADER" -U postgres > export/shared_accesses.csv
        ```

2. Copy the export directory to your PILOS server
3. Run ```php artisan import:greenlight``` with the path to your export directory
   
   **Example**
    ```bash
   php artisan import:greenlight storage/app/export-greenlight/
    ```
