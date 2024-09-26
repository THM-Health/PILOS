---
title: Getting Started
---

Before implementing a feature or fixing a bug or security issue you need to set up a development environment.
The easiest way is to install [Docker Desktop](https://docs.docker.com/get-docker/) on your machine.
If you are using windows, you need to set up WSL2 first and configure docker to use WSL.

## Dev command line tool
For the development environment the same docker containers as for the production environment are used.
However, the `docker-compose-dev.yml` file is optimized for development and a helper command line tool called `sail` is provided.
It is a script created by Laravel to wrap common docker compose commands and has been adjusted for PILOS.

## Installation
First clone the repository to your preferred directory (for Windows inside of WSL).
```bash
git clone https://github.com/THM-Health/PILOS.git
cd PILOS
```

Next we need to create a `.env` file by copying the default `.env.example` file.
```bash
cp .env.example .env
```

Now we should adjust the `.env` file for development:
```
APP_ENV=local
APP_DEBUG=true
```

To create a new container you can use the following command:
```bash
./sail build
```

The www-data use inside the container should have the same user id as the user on the host system.
This allows both the host and the container to access and modify the same files.
Building the container using sail will automatically set the `WWWGROUP` and `WWWUSER` to the user id of the host system.

If you want to build the container directly using docker compose, you need to set the `WWWGROUP` and `WWWUSER` in the .env file to the user id of the host system.

You can start the application with:
```bash
./sail up -d 
```

To adjust the port of the webserver, change `APP_PORT` in the `.env` file.

## SSL
In case you want to use SSL, you need a domain name and a valid SSL certificate.
Place the certificate as `fullchain.pem` and the key as `privkey.pem` in the `ssl` directory (create if not exists).
Then you need to set the following environment variables in the .env file:
```bash
APP_URL=https://your-domain.com
VITE_SSL=true
VITE_HOST=your-domain.com
```
The docker container will detect the certificate and key on the next start and use them for the webserver.

## Install dependencies
```bash
./sail composer install
./sail npm install
```

## Adjust config
In the `.env` file you can make your necessary adjustments.

Also, it is necessary to generate a new application key with the following command:
```bash
./sail artisan key:generate
```

Make sure to have `APP_ENV=local` during local development.
If set to `production`, some caching and performance optimisation is done during the start of the container, which makes it impossible to edit the source code in real time.

## Database

### Using MariaDB
The development environment comes with mariadb that is preconfigured in the .env file.

### Using PostgreSQL
You can also use PostgreSQL as an alternative database since PILOS v2.

To run a local PostgreSQL using docker you have to adjust the `docker-compose-dev.yml` file:
```yml
    db:
      image: postgres:14.6-alpine3.17
      container_name: postgres
      restart: unless-stopped
      volumes:
        - postgres:/var/lib/postgresql/data
        - './tests/Utils/create-postgres-testing-database.sql:/docker-entrypoint-initdb.d/10-create-testing-database.sql'
      environment:
        PGPASSWORD: '${DB_PASSWORD}'
        POSTGRES_USER: '${DB_USERNAME}'
        POSTGRES_PASSWORD: '${DB_PASSWORD}'
        POSTGRES_DB: '${DB_DATABASE}'
      healthcheck:
        test: ["CMD-SHELL", "pg_isready"]
        retries: 3
        timeout: 5s
```

We also have to adjust the volume configuration in the `docker-compose-dev.yml`:
```yml
volumes:
  postgres:
    driver: local
```

After implementing these changes the docker-container has to be restarted with:
```bash
./sail down
./sail up -d 
```

To use a different database adjust the `.env` file:

```bash
# Database config
DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
```

### Running Migrations and Seeders
You need to run the artisan command for migration and seeding.
In the production setup this command is run automatically on startup.

```bash
./sail artisan migrate --seed
```

### PHPMyAdmin
You can manage your MariaDB using PHPMyAdmin.
To adjust the port of PHPMyAdmin, change FORWARD_PHPMYADMIN_PORT in the .env file.
By default, PHPMyAdmin is served at http://localhost:8080

## Superuser
To create a new superuser run the artisan command for superuser creation (see [Getting Started](../administration/02-getting-started.md))
```bash
./sail artisan users:create:superuser
```

## LDAP
For local development the included LDAP server can be used. To use this, it must first be configured in the `.env`:
```bash
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

# LDAP logging debugging only
LDAP_LOGGING=true

# Attribute with GUID; OpenLDAP: 'entryuuid', AD: 'objectGUID'
LDAP_GUID_KEY=entryuuid

# Comma seperated list of the object class
LDAP_OBJECT_CLASSES=top,person,organizationalperson,inetorgperson

# Attribute by which the user should be found in the LDAP
LDAP_LOGIN_ATTRIBUTE=uid
```

Then the attribute and role mapping must be configured by creating a file in the following path `app/Auth/config/ldap_mapping.json`:

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

This role mapping gives users of the group students the user role and users of the group staff the admin role.

There are three user accounts (see `docker/openldap/bootstrap.ldif`)
1. Name: John Doe, Username: jdoe, Password: password, Groups: Student
2. Name: Richard Roe, Username: rroe, Password: password, Groups: Staff
3. Name: John Smith, Username: jsmi, Password: password, Groups: Student and Staff

### PHPLdapAdmin
The manage your local openldap server, you can use the PHPLdapAdmin UI.
To adjust the port of PHPLdapAdmin, change FORWARD_PHPLDAP_PORT in the .env file.
By default PHPLdapAdmin is servered at http://localhost:6680

## BigBlueButton
For testing functionality of the application which requires a running BigBlueButton server you may need to install a server on your development machine.

## Finish Setup
Checkout the [Administration docs](../administration/01-intro.md) for additional steps needed to finish your setup.

The production container automatically runs the `pilos-cli frontend:build` command to build the frontend.
In the development environment you can build the frontend with the following command:
```bash
./sail npm run build
```

However, for development it is recommended to use the development server for hot reloading:
```bash
./sail npm run dev
```

For the development you can use any editor of your choice but please do not check in any configuration files for your editor. In this case you may want to
extend the `.gitignore` with yours editor config files.
