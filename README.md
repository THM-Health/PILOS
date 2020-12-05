# PILOS

![Status](https://github.com/THM-Health/PILOS/workflows/CI/badge.svg)
[![codecov](https://codecov.io/gh/THM-Health/PILOS/branch/master/graph/badge.svg?token=6EXYQKIG3W)](https://codecov.io/gh/THM-Health/PILOS)

PILOS (Platform for Interactive Live-Online Seminars) is an easy to use frontend for [BigBlueButton](https://bigbluebutton.org/) developed at the TH Mittelhessen University of Applied Sciences ([THM](https://thm.de/)) Faculty of Health ([FB GES](https://www.thm.de/ges/)).
It is based on the experience of students, teachers and staff during the covid-19 pandemic and the raised need for a modern and flexible video conferencing system for the use case of digital class rooms, group learning and other digital meetings. 


**This Frontend uses BigBlueButton and is not endorsed or certified by BigBlueButton Inc. BigBlueButton and the BigBlueButton Logo are trademarks of BigBlueButton Inc.**

## Table of Contents 
* [About](#About)
* [Architecture](#Architecture)
* [Installation](#Installation)
* [Stacks](#Stacks)
* [Contributing](#Contributing)
* [License](#License)

## About 

The interface is similar to another open-source project [Greenlight](https://github.com/bigbluebutton/greenlight).
During the online semester 2020 many features araised that could not be solved or were hard to implement into Greenlight.
The team behind Greenlight did an amazing job and we want to thank for their hard work!

However due to the underlying ruby-on-rails software architecture and the small amount of rails software-packages
we decided to build a new system with another architecture.

## Architecture

PILOS is using [Vue.js](https://vuejs.org/) as the Frontend JavaScript Framework, [Laravel](https://laravel.com/) as a PHP based JSON API and littleredbutton's [bigbluebutton-api-php](https://github.com/littleredbutton/bigbluebutton-api-php) as the api for controlling BBB.

## Installation

[Laravel](https://laravel.com/) is the main framework that used to develop PILOS. Follow the documentation [here](https://laravel.com/docs/7.x/) to install it in your development machine. 

A BigBlueButton server is necessary to use this application. See how to setup a BigBlueButton server [here](https://docs.bigbluebutton.org/).  

### 1. How to run

Laravel provides an easy way to setup the environment for PILOS with [Homestead](https://laravel.com/docs/7.x/homestead) and [Vagrant](https://www.vagrantup.com/).
 
After you configured your Vagrant Box a Test LDAP Server is necessary as well to test LDAP-Login see the wiki [here](https://github.com/THM-Health/PILOS/wiki/Installing-OpenLDAP) to set it up in your vagrant box. 

Then create an ```.env``` file inside your project and copy the content of ```.env.sample``` data inside it. 

After that you need to generate Base64 ```APP_KEY``` as well using artisan command. 

```
php artisan key:generate
```

Next you want to configure your ``.env`` file accordingly to your vagrant box. The info about your vagrant box is inside ``Homestead.yaml`` file. It is important to configure your ``SANCTUM_STATEFUL_DOMAINS`` and ``SESSION_DOMAIN`` value inside your ``.env`` file with your vagrant box ip inside the ``Homestead.yaml`` file.

```
LDAP_LOGGING=true
LDAP_CONNECTION=default
LDAP_HOST=127.0.0.1
LDAP_USERNAME="uid=mstt,ou=people,dc=local,dc=com"
LDAP_PASSWORD="secret"
LDAP_PORT=389
LDAP_BASE_DN="dc=local,dc=com"
LDAP_TIMEOUT=5
LDAP_SSL=false
LDAP_TLS=false

SANCTUM_STATEFUL_DOMAINS=192.168.10.10
SESSION_DOMAIN=192.168.10.10
```

You can check if the LDAP configured correctly using artisan command.

```
php artisan ldap:test
```

Next you want to migrate and seed the database using again another artisan command. 

```
php artisan migrate
php artisan db:seed
```

Lastly you can run the following command in your host machine ``npm install `` then ``npm run watch`` or ``npm run dev``  also
``composer install `` and ``php artisan serve`` inside your vagrant ssh terminal.


To log the status of all meetings and servers and to keep the database up to date, setup a cronjob on your server.

```
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

## Stacks

1. [BigBlueButton](https://bigbluebutton.org/) - BigBlueButton is an open source web conferencing system.
2. [littleredbutton/bigbluebutton-api-php](https://github.com/littleredbutton/bigbluebutton-api-php) - An unofficial php api for BigBlueButton.
3. [Laravel](https://laravel.com/) - Laravel is a web application framework with expressive, elegant syntax. We’ve already laid the foundation — freeing you to create without sweating the small things.Laravel is a web application framework with expressive, elegant syntax. We’ve already laid the foundation — freeing you to create without sweating the small things.
4. [Vue](https://vuejs.org/) -  a progressive Javascript framework for building user interfaces
5. [Vuex](https://vuex.vuejs.org/) - Vuex is a state management pattern + library for Vue.js applications.
6. [Vue Router](https://router.vuejs.org/) - Vue Router is the official router for Vue.js. It deeply integrates with Vue.js core to make building Single Page Applications with Vue.js a breeze. Features include
7. [Vue Bootstrap](https://bootstrap-vue.org/) - With BootstrapVue you can build responsive, mobile-first, and ARIA accessible projects on the web using Vue.js and the world's most popular front-end CSS library — Bootstrap v4.


## Contributing

See how to contribute to the project check our [guidelines](CONTRIBUTE.MD)

## License

This PILOS project is open-sourced software licensed under the LGPL license.
