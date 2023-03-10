# Migrate from PILOS v1 to PILOS v2

## Database
The database schema has changed quite a lot from v1 to v2.
This was necessary to support PostgreSQL in the future.
This version also fixes inconsistent naming of table columns, eases development and cleans up the long migration list.

To migrate to v2 just run: `php artisan db:upgrade` or if you are using sail: `sail artisan db:upgrade`

## LDAP
LDAP is disabled by default. To enable LDAP change the `LDAP_ENABLED` option in the .env file to `true`.

### Role Mapping Syntax
The syntax for role mapping is now notated in JSON, to allow more complex role names.

**Before**

`LDAP_ROLE_MAP='A=admin,U=user'`

**After**

`LDAP_ROLE_MAP='{"A":"admin","U":"user"}'`

## Theme
In v2 the default theme and color are not based on the [corporate design](https://www.thm.de/thmweb/) guidelines of [Technische Hochschule Mittelhessen University of Applied Sciences](https://thm.de) anymore.

### Custom theme
1. Copy the content of `resources/sass/theme/default` to `resources/sass/theme/custom`
2. Adjust values in _variables.scss.
3. Change the `VITE_THEME` option in the .env file to `custom`.
4. Recompile the frontend with: `npm run build`

### v1 theme
1. Change the `VITE_THEME` option in the .env file to `thm`.
2. Recompile the frontend with: `npm run build`


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