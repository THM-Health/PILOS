---
title: Default Setting
description: Adjust the default settings of PILOS used during initialization
---

Many application settings can be adjusted in the UI.
You can adjust some default settings of PILOS by adding the desired values to the `.env` file.

After the first start of the application, the settings are stored in the database and can be adjusted in the admin UI.
All changes to the `.env` variables will have no effect.

| Setting in the `.env` file | Default Value            | Description                                                   |
|----------------------------|--------------------------|---------------------------------------------------------------|
| APP_NAME                   | PILOS                    | Name of the application, used in page title, emails, etc. (1) |
| DEFAULT_HELP_URL           | ---                      | Link to a user documentation, shown in the main menu          |
| DEFAULT_LEGAL_NOTICE_URL   | ---                      | Link to a legal notice, shown in the footer                   |
| DEFAULT_PRIVACY_POLICY_URL | ---                      | Link to a privacy policy, shown in the footer                 |
| DEFAULT_FAVICON            | /images/favicon.ico      | Relative or absolute path to the favicon                      |
| DEFAULT_FAVICON_DARK       | /images/favicon-dark.ico | Relative or absolute path to the dark version favicon         |
| DEFAULT_LOGO               | /images/logo.svg         | Relative or absolute path to the logo                         |
| DEFAULT_LOGO_DARK          | /images/logo-dark.svg    | Relative or absolute path to the dark version logo            |
| DEFAULT_TIMEZONE           | UTC                      | Default timezone for all new users                            |

1: The application name should also be changed in the `.env` file, as some parts of the framework might use the value directly
and do not read the settings from the database.

## Image paths
In case you want to customize the images of the applications (logo and favicon) before the first start of the application, follow the steps below:
1. Mount the `public/images/custom` folder into the container by adjusting the docker-compose file. 
    ```yaml
    - './public/images/custom:/var/www/html/public/images/custom'
    ```
2. Put the custom images under the path `public/images/custom`.
2. Adjust the `.env` file with the relative path `/images/custom/` , e.g. `DEFAULT_LOGO=/images/custom/logo.svg`

:::info
The logo and favicon can always be adjusted in the admin UI by uploading new images or setting a URL.
:::


