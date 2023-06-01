# Contributing

Thanks that you want to contribute to our project.

Checkout the section [Report a bug](#report-a-bug) if you found a bug, or you only have a question, or a feature request.

## Table of Contents
* [Code of conduct](#code-of-conduct)
* [Setting up a development environment](#setting-up-a-development-environment)
* [Workflow](#workflow)
  * [Report a bug](#report-a-bug)
  * [Implementation](#implementation)
  * [Testing](#testing)
  * [Submit changes](#submit-changes)
* [Styleguide](#styleguide)
* [Localization](#localization)

## Code of conduct

Everyone how want to contribute to this project including the owners must hold our [Code of Conduct](CODE_OF_CONDUCT.md).

## Setting up a development environment

Before implementing a feature or fixing a bug or security issue you need to set up a development environment.
The easiest way is to install [Docker Desktop](https://docs.docker.com/get-docker/) on your machine.
If you are using windows, you need to set up WSL2 first and configure docker to use WSL.

Next clone the repository to your preferred directory (for Windows inside of WSL) execute the following command. This will create a temp. docker container with php and composer installed.
It will download the required packages and the scripts you need to run laravel sail.
```bash
docker run --rm \
-u "$(id -u):$(id -g)" \
-v $(pwd):/var/www/html \
-w /var/www/html \
laravelsail/php81-composer:latest \
composer install --ignore-platform-reqs
```

Next you should set an alias for sail.
```bash
alias sail='bash ./sail'
```

We also need to create a .env file by copying the default .env.example file.
```bash
cp .env.example .env
```

You can start the application with: `sail up -d` 
To adjust the port of the webserver, change APP_PORT in the .env file.

### SSL (optional)
In case you want to use SSL, you need a domain name and a valid SSL certificate.
Place the certificate as `fullchain.pem` and the key as `privkey.pem` in the `ssl` directory (create if not exists).
Then you need to set the following environment variables in the .env file:
```bash
APP_URL=https://your-domain.com
VITE_SSL=true
VITE_HOST=your-domain.com
```
The docker container will detect the certificate and key on the next start and use them for the webserver.

### Install dependencies
```bash
sail composer install
sail npm install
```

### Adjust config
In the `.env` file you can make your necessary adjustments.

Also, it is necessary to generate a new application key with the following command:
```bash
sail artisan key:generate
```

### Database
The development environment comes with mariadb that is preconfigured in the .env file.
You need to run the artisan commands for migration and seeding (see README.md).
**Example** 
```bash
sail artisan migrate
sail artisan db:seed
```

### PHPMyAdmin
To adjust the port of PHPMyAdmin, change FORWARD_PHPMYADMIN_PORT in the .env file.
By default, PHPMyAdmin is served at http://localhost:8080

### Admin user
To create a new admin user run the artisan command for admin user creation (see README.md).
```bash
sail artisan users:create:admin
```

### LDAP 
For local development the included LDAP server can be used. To use this, it must first be configured in the .env. Then the attribute and role mapping must be configured.

**`.env`**
```
# LDAP config
LDAP_ENABLED=true
LDAP_HOST=openldap
LDAP_USERNAME="cn=readonly,dc=university,dc=org"
LDAP_PASSWORD="readonly"
LDAP_PORT=389
LDAP_BASE_DN="ou=people,dc=university,dc=org"
LDAP_TIMEOUT=5
LDAP_SSL=false
LDAP_TLS=false
LDAP_LOGGING=true
LDAP_GUID_KEY=entryuuid
AUTH_LOG_ROLES=true
```

**`app/Auth/config/ldap_mapping.json`**

This role mapping gives users of the group students the user role and users of the group staff the admin role.

```json
{
  "attributes": {
    "external_id": "uid",
    "first_name": "givenname",
    "last_name": "sn",
    "email": "mail",
    "groups": "memberOf"
  },
  "roles": [
    {
      "name": "user",
      "disabled": false,
      "rules": [
        {
          "attribute": "groups",
          "regex": "/^cn=students,ou=groups,dc=university,dc=org$/i"
        }
      ]
    },
    {
      "name": "admin",
      "disabled": false,
      "all": true,
      "rules": [
        {
          "attribute": "groups",
          "regex": "/^cn=staff,ou=groups,dc=university,dc=org$/i"
        }
      ]
    }
  ]
}
```

There are three user accounts (see docker/openldap/bootstrap.ldif)
1. Name: John Doe, Username: jdoe, Password: password, Groups: Student
2. Name: Richard Roe, Username: rroe, Password: password, Groups: Staff
3. Name: John Smith, Username: jsmi, Password: password, Groups: Student and Staff

### PHPLdapAdmin
The manage your local openldap server, you can use the PHPLdapAdmin UI.
To adjust the port of PHPLdapAdmin, change FORWARD_PHPLDAP_PORT in the .env file.
By default PHPLdapAdmin is servered at http://localhost:6680

### BigBlueButton
For testing functionality of the application which requires a running BigBlueButton server you may need to install a server on your development machine.

### Finish Setup
Checkout the installation guide in the [readme](README.md) for additional steps needed to finish the setup. Instead of
running `sail npm run build` you must run in the dev environment `sail npm run dev`. For the development you can use any
editor of your choice but please do not check in any configuration files for your editor. In this case you may want to
extend the `.gitignore` with yours editor config files.

## Workflow

If you have a question, found a bug, or a feature is missing please report this by creating an issue in this repository.
In case when you have a solution for the feature or bug you can fork this repository and implement the solution in a
corresponding branch, since we are working by the [GitHub flow](https://guides.github.com/introduction/flow/). If
everything is ok, after a review your implementation will be merged in the main branch of the repository.

### Report a bug
Before reporting a new issue, please checkout the existing open and already **closed** issues. May be there is already a
solution for your question. If there is no appropriate issue, you can open a new one. If it is only a question you may
open an empty formless issue. In case of a feature request, or a bug report you must use the corresponding template.
Please fill out everything you can so that other can understand your problem and implement a solution or give an answer
as fast as possible without any additional discussions.

### Implementation
In case if you have a solution for a bug, or you want to implement a new feature please fork this repository, create a
new branch, implement the solution by following the [Styleguide](#styleguide) and afterwards create a pull request to
this repository. Please also don't forget to update the [Changelog](CHANGELOG.md) under the section `Unreleased`. After
creating a pull request fulfill the checklist in the template. Only if everything done and the PR is linked to an
existing issue, the pull request will be checked by a maintainer of this repository.

### Testing
A new development shouldn't decrease the code testing coverage. Everything in the application must be covered by
appropriate unit and feature tests, depending on the case. In case of bugfixes a test, that fails in the appropriate
case should be implemented, to make regression tests possible for further changes in the application. For the backend the
api can be tested by using feature tests and other functions just with unit tests. For more information about tests
checkout the [Laravel testing guides](https://laravel.com/docs/9.x/testing).

#### Frontend
The frontend implemented in vue, and the tests gets executed by the test framework vitest.
The api responses can be stubbed by using the [moxios](https://github.com/axios/moxios) framework.
In case of api changes, the stubbed responses also should be changed. For more information about writing tests for the frontend, consider the vue test utils [documentation](https://vue-test-utils.vuejs.org/) and the [Vue Testing Handbook](https://lmiller1990.github.io/vue-testing-handbook/#what-is-this-guide).

To run the frontend tests, execute the following command:
```bash
sail npm run test
```
You can also run the tests with an integrated web-UI:
```bash
sail npm run test:ui
```


### Submit changes
After implementing the new feature or bugfix you must create a new pull request to the original repository by using the
corresponding pull request template. If all checks by the ci passed and all tasks in the pull request done, a maintainer
of the repository will check the PR and may make some comments on your PR. If everything fixed or there were no problems
at all, then the PR will be merged into the main branch of this repository.

## Styleguide
The backend uses the php framework Laravel and therefore it follows the
[Laravel coding style guide](https://laravel.com/docs/9.x/contributions#coding-style). To apply the code style to your
implemented code you can run the command `sail composer run fix-cs`.
The frontend style gets checked by eslint. The style can be fixed by running the command `sail npm run fix-cs`. For best
practices checkout the [vue style guide](https://vuejs.org/v2/style-guide/).

Additionally, to the style guides the following things should apply to the changes:
* Short and meaningful method, attribute and class names
* Short and not complex methods
* Make things dry and reuse where possible (e.g. mixins or components in the frontend)
* Errors should be handled (in the frontend at least with the `Base.error()` method)
* Permissions should be checked where necessary in frontend and backend
* Validations for requests must exist in the backend
* Translation of static language at least in English
* Don't change already committed database migrations
* Change only database seeds if they are considered, to be executed multiple times
* Define application settings where possible, instead of just hardcode things or creating environment variables
* Don't implement multiple issue solutions in one branch
* Use short and meaningful branch names with the issue number and a short description in the imperative mood
* Commit messages should also use the imperative mood and be as short as possible (checkout also [this](https://chris.beams.io/posts/git-commit/#limit-50) blogpost)

## Localization

If you implement a new feature, please also add the translation for the new or changed strings.
The translation files are located in the `lang` folder and placed in sub-directories by the language code and group name e.g. `en/home.php`.
Please note: The translation files are used by the frontend and the backend.
Each locale file return a nested php array.

### General language changes
If you want to change the translation of an existing string, please contribute to our [POEditor](https://poeditor.com/join/project/UGpZY4JAnz) project.
We will update the translation files with the next release.

### Available and default languages
You can change the available languages and the default language in the `.env` file with the keys `VITE_AVAILABLE_LOCALES` and `VITE_DEFAULT_LOCALE`.

### Customize locales
Within the locale directory you can create files with the group name (part before the first dot in the translation string) as filename.
For example, the string `auth.ldap.username_help` would be stored in the file `auth.php`.

Within the file, the keys are organized in nested php arrays.
Example for a custom german locale (`resources/custom/lang/de/auth.php`):
```php
<?php

return [
    'ldap' =>  [
        'username_help' => 'Test'
    ]
];
```

To customize the date time format and the display name of a locale create a json file `metadata.json` in the locales directory.
```json
{
    "name": "German",
    "dateTimeFormat":  {
        "dateShort": { 
            "year": "numeric",
            "month": "2-digit",
            "day": "2-digit" 
        },
        "dateLong": {
            "year": "numeric",
            "month": "short",
            "day": "2-digit"
        },
        "time": {
            "hour": "2-digit",
            "minute": "2-digit",
            "hour12": false
        },
        "datetimeShort": {
            "year": "numeric",
            "month": "2-digit",
            "day": "2-digit",
            "hour": "2-digit",
            "minute": "2-digit",
            "hour12": false
        },
        "datetimeLong": {
            "year": "numeric",
            "month": "short",
            "day": "2-digit",
            "hour": "2-digit",
            "minute": "2-digit",
            "hour12": false
        }
      }

}
```

### New locales
To add custom locales that are not part of the core, add them to the resources/custom/lang directory as well.
You need to create all php files and metadata.json file.
To enable the new locale, you need to add it to the `VITE_AVAILABLE_LOCALES` .env option and rebuild the frontend.

### Sync localisation data with POEditor 

Before you can sync the locales, you have to set the .env variables `POEDITOR_TOKEN` and `POEDITOR_PROJECT`.

To upload the locale to POEditor  run `php artisan locales:upload` or, if you use sail: `sail artisan locales:upload`.


To import the locale to POEditor  run `php artisan locales:import` or, if you use sail: `sail artisan locales:import`.

