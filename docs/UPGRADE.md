# Upgrade from PILOS v1 to PILOS v2

## Migrate from native to docker

1. Create a dump of your current database with mysqldump: `mysqldump DB_NAME > db_backup.sql` (adjust DB_NAME)
2. Install PILOS with docker (see [INSTALL.md](INSTALL.md))
3. Adjust .env
4. Start docker compose (docker compose up -d)
5. Copy backup file to new docker installation directory (where the docker-compose.yml file is)
6. Copy backup file into container: `docker compose cp ./db_backup.sql app:/var/www/html/db_backup.sql`
7. Remove the auto. generated db: `docker compose exec --user www-data app php artisan db:wipe --force`
9. Import the backup: `docker compose exec --user www-data app php artisan db:import db_backup.sql`
10. Upgrade db to new version: `docker compose exec --user www-data app php artisan db:upgrade`
11. Install latest db migrations: `docker compose exec --user www-data app php artisan migrate`
12. Copy all files from the directory `storage/app` of native installation to the folder `storage/app` in the new docker installation

## Database
The database schema has changed quite a lot from v1 to v2.
This was necessary to support PostgreSQL in the future.
This version also fixes inconsistent naming of table columns, eases development and cleans up the long migration list.

To migrate to v2 just run: `php artisan db:upgrade` or if you are using sail: `sail artisan db:upgrade`

## LDAP
LDAP is disabled by default. To enable LDAP change the `LDAP_ENABLED` option in the .env file to `true`.

### Role and attribute mapping

Authentication with LDAP has been fundamentally refactored.
In the process, some .env variables were changed, added or removed. The following table provides an overview of the changes.

| Old .env Attribute | New .env  Attribute | Description |
|-----------|--------|-------------|
| LDAP_ROLE_ATTRIBUTE | *Removed* | Attribute with the users role, can be a multi value attribute, replaced with new mapping json file |
| LDAP_ROLE_MAP | *Removed* | Map the attribute to the name of a local role, replaced with new mapping json file |
| AUTH_LOG_LDAP_ROLES | AUTH_LOG_ROLES | Show found roles during mapping |
| - | LDAP_GUID_KEY | Attribute with GUID; OpenLDAP (default): 'entryuuid', AD: 'objectGUID' |
| - | LDAP_OBJECT_CLASSES | Comma seperated list of the object class (default: top,person,organizationalperson,inetorgperson) |
| - | LDAP_LOGIN_ATTRIBUTE | Attribute by which the user should be found in the LDAP (default: uid) |
| - | LDAP_FILTER | Raw LDAP filter |
| - | LDAP_LOAD_ATTRIBUTES_AS_USER | Load the users attributes by using the users credentials |

Please have a look at the [external authentication documentation](EXTERNAL_AUTHENTICATION.md)

## Theme
In v2 the default theme and color are not based on the [corporate design](https://www.thm.de/thmweb/) guidelines of [Technische Hochschule Mittelhessen University of Applied Sciences](https://thm.de) anymore.

### Custom theme
1. Copy the content of `resources/sass/theme/default` to `resources/sass/theme/custom`
2. Adjust values in _variables.scss.
3. Change the `VITE_THEME` option in the .env file to `custom`.
4. Adjust colors in .env (`VITE_HISTORY_PARTICIPANT_COLOR`,`VITE_HISTORY_VOICES_COLOR`,`VITE_HISTORY_VIDEOS_COLOR`,`VITE_ROOM_TYPE_COLORS`,`VITE_BANNER_BACKGROUND_COLORS`,`VITE_BANNER_TEXT_COLORS`)
5. Recompile the frontend with: `npm run build`

### v1 theme
1. Change the `VITE_THEME` option in the .env file to `thm`.
2. Update colors in .env
```
# Color of the room history chart
VITE_HISTORY_PARTICIPANT_COLOR='#9c132e'
VITE_HISTORY_VOICES_COLOR='#00b8e4'
VITE_HISTORY_VIDEOS_COLOR='#f4aa00'
# Colors for color pickers (room type and application banner)
VITE_ROOM_TYPE_COLORS='["#4a5c66", "#80ba24", "#9c132e", "#f4aa00", "#00b8e4", "#002878"]'
VITE_BANNER_BACKGROUND_COLORS='["#4a5c66", "#80ba24", "#9c132e", "#f4aa00", "#00b8e4", "#002878"]'
VITE_BANNER_TEXT_COLORS='["#ffffff", "#000000"]'
```
3. Recompile the frontend with: `npm run build`


## Changed .env variables
Many .env variables for theming have been added and the prefix changed from `MIX_` to `VITE_`. Please have a look in the `.env.example` and adjust your `.env` file accordingly.

## Locales
Custom locales are now json files in the `resources/custom/lang` folder.

Example for a custom german locale (`resources/custom/lang/de.json`):
```json
{
  "auth.ldap.username_help": "Test"
}
```

## Images
The path for custom images changed from `resources/custom/images` to `public/images/custom`.
To customize the images of the applications (logo and favicon) put the custom images under the path `public/images/custom` and adjust your .env file to the the new path, e.g. `DEFAULT_LOGO=/images/custom/logo.svg`.

Note: If you have already startet the application (no fresh database), the logo and favicon path must be changed in the admin UI.
