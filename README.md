# PILOS

[![PILOS](https://video.ges.thm.de/img/PILOS.svg)](https://video.ges.thm.de/index.html)

PILOS is the system for the video conference in class and group learning, which has been in use at the THM Faculty of Health ([FB GES](https://www.thm.de/ges/)) since the summer semester 2020.
It is based on [BigBlueButton](https://bigbluebutton.org/) and [Greenlight](https://github.com/bigbluebutton/greenlight).

## Table of Contents 
* [About](#About)
* [Architecture](#Architecture)
* [Installation](#Installation)
* [Stacks](#Stacks)
* [Contributing](#Contributing)
* [License](#License)

## About 

PILOS is the complete system for the video conference in class and group learning, which has been in use at the THM Faculty of Health ([FB GES](https://www.thm.de/ges/)) since the summer semester 2020.
It is based on [BigBlueButton](https://bigbluebutton.org/) and [Greenlight](https://github.com/bigbluebutton/greenlight).

This project is currently working on the conversion of the Greenlight client, which is based on the [Ruby-On-Rails](https://rubyonrails.org/) framework, to the [Laravel](https://laravel.com/) framework.

## Architecture

Illustration here

## Installation

[Laravel](https://laravel.com/) is the main framework that used to develop PILOS. Follow the documentation [here](https://laravel.com/docs/7.x/) to install it in your development machine. 

BigBlueButton server is necessary to use this application. See how to setup a BigBlueButton server [here](https://docs.bigbluebutton.org/).  

### 1. Environment setup

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

Lastly you want to migrate and seed the database using again another artisan command. 

```
php artisan migrate
php artisan db:seed
```

## Stacks

1. [BigBlueButton](https://bigbluebutton.org/) - BigBlueButton is an open source web conferencing system.
2. [Greenlight](https://github.com/bigbluebutton/greenlight) - Greenlight is a simple front-end interface for your BigBlueButton server.
3. [Laravel](https://laravel.com/) - Laravel is a web application framework with expressive, elegant syntax. We’ve already laid the foundation — freeing you to create without sweating the small things.Laravel is a web application framework with expressive, elegant syntax. We’ve already laid the foundation — freeing you to create without sweating the small things.
4. [Vue](https://vuejs.org/) -  a progressive Javascript framework for building user interfaces
5. [Vuex](https://vuex.vuejs.org/) - Vuex is a state management pattern + library for Vue.js applications.
6. [Vue Router](https://router.vuejs.org/) - Vue Router is the official router for Vue.js. It deeply integrates with Vue.js core to make building Single Page Applications with Vue.js a breeze. Features include
7. [Vue Bootstrap](https://bootstrap-vue.org/) - With BootstrapVue you can build responsive, mobile-first, and ARIA accessible projects on the web using Vue.js and the world's most popular front-end CSS library — Bootstrap v4.


## Contributing

See how to contribute to the project here (CONTRIBUTE.MD) Insert guideline here

## License

This PILOS project is Insert License Here (TBD).
