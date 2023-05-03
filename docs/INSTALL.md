# Installing PILOS

## Docker
To make installing PILOS easy, we provide a Docker image.
The application will be installed with some default settings, but you can customize it later via the UI, config files and overriding some files.

### Docker Tags
We use [Semantic Versioning](https://semver.org/spec/v2.0.0.html) for our releases and tag the images accordingly.

It is **recommended** to use the image with the latest major version e.g. `v1.9.5` -> `v1` to always get the latest features and bugfixes.

**[All Tags](https://hub.docker.com/r/pilos/pilos/tags)**

#### Development Images
Additionally, we provide images for the latest commit on the `master` and the release branches, e.g. `dev-v1`.

#### Latest
We **don't** recommend using the `latest` tag for production, as breaking changes can cause you some trouble.
**Always** check the changelog before changing the major version!

### Requirements
- fully qualified hostname
- valid SSL certificate (HTTPS)
- reverse proxy, e.g. apache or nginx
- Docker and [Compose plugin](https://docs.docker.com/compose/install/linux/)

### Installing PILOS
Create a directory for the data and config of PILOS
```bash
mkdir ~/pilos && cd ~/pilos
```

To make the following steps independent to docker image changes, we define an environment variable.
Adjust the docker image tag according to the version you want to use (see [Docker Tags](#docker-tags) section).
```bash
export IMAGE="pilos/pilos:latest"
```

Next we need the `docker-compose.yml` and `.env` files. They can be copied from the image to your host.
```bash
docker run --rm $IMAGE cat ./.env.example > .env
docker run --rm $IMAGE cat ./docker-compose.yml > docker-compose.yml
```

If you used a different docker image tag, you need to adjust the image tag in the `docker-compose.yml` file.

### Configuring PILOS
In the .env file all application settings can be found, some of them can be changed with the UI.
We need to set the `APP_KEY` option in the `.env` file, as this is used to encrypt sessions, cookies, urls, etc.

Using the following command a secure key is generated:
```bash
docker run --rm $IMAGE php artisan key:generate --show
```
Copy the output and edit the `APP_KEY` option in the `.env` file.

**Example**: `APP_KEY=base64:WJKM8YsGNutfcc3+2q/xiWE9Sus8GcbNVvTKFgdYgPw=`

You also need to edit the `APP_URL` option in the `.env` file to match the domain from which the application will be accessible from. 

### Database
The docker-compose.yml provides a mariadb.
To create a secure default database password, run the following command:
```bash
openssl rand -hex 24
```
Copy the output and edit the `DB_PASSWORD` option in the `.env` file.

**Example**: `DB_PASSWORD=44cefe1bc30ddf6bd2013a97f58353acb5e9000e7ec3bb90`


### Webserver
PILOS has a build in apache webserver. However, it is **highly** recommended to not expose the container port.
You will need to set up a reverse proxy that routes the traffic to this application (default: 127.0.0.1:5000)

**Apache**
```apacheconf
ProxyPreserveHost On

ProxyPass "/"  "http://127.0.0.1:5000/"
ProxyPassReverse "/"  "http://127.0.0.1:5000/"

RequestHeader set X-Forwarded-Proto "https"
RequestHeader set X-Forwarded-Port "443"
```

You may need to adjust the X-Forwarded-Proto and X-Forwarded-Port settings, depending on your environment.

**Nginx**
```nginx
location / {
  proxy_pass          http://127.0.0.1:5000;
  proxy_set_header    Host              $host;
  proxy_set_header    X-Forwarded-Port  $server_port;
  proxy_set_header    X-Forwarded-For   $proxy_add_x_forwarded_for;
  proxy_set_header    X-Forwarded-Proto $scheme;
  proxy_http_version  1.1;
}
```

#### Trusted proxies
You have to add your proxy to the list of trusted proxies in the `.env` file.
```
# Trusted proxies for reverse proxy setups
# You can use "*" to trust all proxies that connect directly to the server
# or you can use a comma separated list of trusted proxies, also with support for CIDR notation e.g. "192.0.0.1,10.0.0.0/8"
TRUSTED_PROXIES=
```

### Starting
To start the application and database run:
```bash
docker compose up -d
```

You can monitor the startup with:
```bash
docker compose logs -f
```

**Notice:** If you modify the `.env` file you need to restart the container.

### Admin user
The first admin user can be created by running the following command:
```bash
docker compose exec --user www-data app php artisan users:create:admin
```

### External authentication
PILOS can be connected to external authentication systems.
We currently only support LDAP. OpenID-Connect and SAML 2.0 are in planning.

Please have a look at our [documentation](EXTERNAL_AUTHENTICATION.md) on how to setup external authenticators.

### Customization
#### Theming
You can customize the theme by copying the default theme.
```bash
docker compose cp app:/var/www/html/resources/sass/theme/default/. ./resources/sass/theme/custom
```

You can edit the theme in the folder `resources/sass/theme/custom`.
Next you need to change set the `VITE_THEME` option in the `.env` file to `custom`.
You can either restart the container or recompile the frontend with:
```bash
docker compose exec --user www-data app npm run build
```

#### Start page
You can customize the start page by copying the default content
```bash
mkdir -p resources/custom/js/views
docker compose cp app:/var/www/html/resources/js/views/Home.vue ./resources/custom/js/views/Home.vue
```
You can edit the vue component in `resources/custom/js/views/Home.vue` and either restart the container or recompile the frontend with:
```bash
docker compose exec --user www-data app npm run build
```

#### Language files, footer and more
To customize other files have a look at https://github.com/THM-Health/PILOS/wiki/Customization

## Native

[Laravel](https://laravel.com/) is the main backend framework that used to develop PILOS.
Follow the documentation [here](https://laravel.com/docs/9.x/deployment#server-requirements) to install the necessary libs on your server.

For bundling the javascript frontend nodejs is necessary. Currently, all versions above `12.0.0` are supported.

After installing the necessary packages either download a zip or clone the application into the desired path by using the following git command:
```bash
git clone https://github.com/THM-Health/PILOS.git custom-path
```

Install the necessary requirements for the backend by running the following command:
```bash
composer install
```

Afterwards copy the `.env.example` to `.env` and make your necessary adjustments.
At least the database and email must be configured.

Also, it is necessary to generate a new application key with the following command:
```bash
php artisan key:generate
```

Next it is necessary to initialize the database with the following commands:

```bash
php artisan migrate
php artisan db:seed
```

If you want to adjust the frontend, please checkout this [page](https://github.com/THM-Health/PILOS/wiki/Customization).

Finally, build the frontend using the following npm command:
```bash
npm install
npm run build
```

**Note:** If you have issues installing node-canvas, your architecture is not supported and you have to compile it yourself. Please have a look at https://github.com/Automattic/node-canvas#compiling

The first admin user can be created by running the following command:
```bash
php artisan users:create:admin
```

After successfully executing all the steps above, application is successfully installed and ready to be used.

To log the status of all meetings and servers and to keep the database up to date, setup a cronjob on your server.

```
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

### External authentication
PILOS can be connected to external authentication systems.
We currently only support LDAP. OpenID-Connect and SAML 2.0 are in planning.

Please have a look at our [documentation](EXTERNAL_AUTHENTICATION.md) on how to setup external authenticators.