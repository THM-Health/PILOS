# Import from [greenlight](https://github.com/bigbluebutton/greenlight)

PILOS has a command line tool to import users, rooms and room shares from greenlight.

**Backup your PILOS database before running this script!**

1.  Copy export-greenlight.sh file to your greenlight server
    
2.  Run script to export 'users', 'rooms' and 'shared_accesses' table to csv file ```./export-greenlight.sh PATH_TO_GREENLIGHT PATH_TO_EXPORT_FOLDER```

    PATH_TO_GREENLIGHT: Path to your greenlight docker-compose directory, where docker-compose.yml file and /db folder is located
    
    PATH_TO_EXPORT_FOLDER: Path to where the database should be exported to, if directory does not exist, it is created

    **Example**
    ```console
    foo@bar:~$ ./export-greenlight.sh /home/greenlight/greenlight/ /home/greenlight/greenlight-export/
    Greenlight database was exported to /home/greenlight/greenlight-export/
    ```

3. Copy the export directory to your PILOS server
4. Run ```php artisan import:greenlight PATH_TO_EXPORT_FOLDER```

   PATH_TO_EXPORT_FOLDER: Path to where the database was exported to

   **Example**
    ```console
   foo@bar:~$ php artisan import:greenlight storage/app/export-greenlight/
    ```
