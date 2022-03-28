# PILOS

![Status](https://github.com/THM-Health/PILOS/workflows/CI/badge.svg)
[![codecov](https://codecov.io/gh/THM-Health/PILOS/branch/master/graph/badge.svg?token=6EXYQKIG3W)](https://codecov.io/gh/THM-Health/PILOS)

PILOS (Platform for Interactive Live-Online Seminars) is an easy to use frontend for [BigBlueButton](https://bigbluebutton.org/) developed at the TH Mittelhessen University of Applied Sciences ([THM](https://thm.de/)) Faculty of Health ([FB GES](https://www.thm.de/ges/)).
It is based on the experience of students, teachers and staff during the covid-19 pandemic, and the raised need for a modern and flexible video conferencing system for the use case of digital class rooms, group learning and other digital meetings. 


**This Frontend uses BigBlueButton and is not endorsed or certified by BigBlueButton Inc. BigBlueButton and the BigBlueButton Logo are trademarks of BigBlueButton Inc.**

## Table of Contents 
* [About](#about)
* [Architecture](#architecture)
* [Installation](#installation)
* [Stacks](#stacks)
* [Contributing](#contributing)
* [License](#license)

## About

The interface is similar to another open-source project [Greenlight](https://github.com/bigbluebutton/greenlight).
During the online semester 2020 many features araised that could not be solved or were hard to implement into Greenlight.
The team behind Greenlight did an amazing job, and we want to thank for their hard work!

However, due to the underlying ruby-on-rails software architecture and the small amount of rails software-packages
we decided to build a new system with another architecture.

## Architecture

PILOS is using [Vue.js](https://vuejs.org/) as the Frontend JavaScript Framework, [Laravel](https://laravel.com/) as a PHP based JSON API and littleredbutton's [bigbluebutton-api-php](https://github.com/littleredbutton/bigbluebutton-api-php) as the api for controlling BBB.

## Installation

[Laravel](https://laravel.com/) is the main backend framework that used to develop PILOS. Follow the documentation [here](https://laravel.com/docs/7.x/) to install the necessary libs on your server.

A BigBlueButton server is necessary to use this application. See how to set up a BigBlueButton server [here](https://docs.bigbluebutton.org/).

PILOS allows users to login with LDAP and manual user accounts.
For the LDAP authentication an LDAP server e.g. [OpenLDAP](https://www.openldap.org/) is necessary.
An alternative Shibboleth authenticator is in progress (#139).

For the deployment of the frontend javascript nodejs is necessary. Currently, all versions above `12.0.0` are supported.

After installing the necessary packages either download a zip or clone the application into the desired path by using the following git command:
```bash
git clone https://github.com/THM-Health/PILOS.git custom-path
```

Install the necessary requirements for the backend by running the following command:
```bash
composer install
```

Afterwards copy the `.env.example` to `.env` and make your necessary adjustments.

At least the database, mail and LDAP must be configured, and the two following must be adjusted to the domain where the frontend code is served.
```dotenv
SANCTUM_STATEFUL_DOMAINS=FRONTEND_DOMAIN
SESSION_DOMAIN=FRONTEND_DOMAIN
```

Also, it is necessary to generate a new application key with the following command:
```bash
php artisan key:generate
```

You can check if the LDAP configured correctly, by using the following artisan command:
```bash
php artisan ldap:test
```

Next it is necessary to initialize the database with the following commands:

```bash
php artisan migrate
php artisan db:seed
```

If you want to adjust the frontend, please checkout this [page](https://github.com/THM-Health/PILOS/wiki/Customization).

Finally, build the frontend using the following npm command:
```bash
npm run production
```

You may also want to map LDAP groups to user roles in this application by adjusting the `LDAP_ROLE_ATTRIBUTE` and the `LDAP_ROLE_MAP` environment variables.

The first admin user can be created by running the following command:
```bash
php artisan users:create:admin
```

After successfully executing all the steps above, application is successfully installed and ready to be used.

To log the status of all meetings and servers and to keep the database up to date, setup a cronjob on your server.

```
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

## Stacks

The main parts of the application are:

1. [BigBlueButton](https://bigbluebutton.org/) - BigBlueButton is an open source web conferencing system.
2. [littleredbutton/bigbluebutton-api-php](https://github.com/littleredbutton/bigbluebutton-api-php) - An unofficial php api for BigBlueButton.
3. [Laravel](https://laravel.com/) - Laravel is a web application framework with expressive, elegant syntax. We’ve already laid the foundation — freeing you to create without sweating the small things.Laravel is a web application framework with expressive, elegant syntax. We’ve already laid the foundation — freeing you to create without sweating the small things.
4. [Vue](https://vuejs.org/) -  a progressive Javascript framework for building user interfaces.

A almost full list of libraries and other software components can be found [here](https://github.com/THM-Health/PILOS/wiki/Libraries)!

## Contributing

Please check our contribution [guidelines](CONTRIBUTING.md).

## License

This PILOS project is open-sourced software licensed under the LGPL license.
