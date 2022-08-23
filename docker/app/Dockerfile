FROM php:8.1-fpm-bullseye

LABEL maintainer="Samuel Weirich"
LABEL description="Development container for PILOS, compatible with laravel sail; heavily inspired by offical image"

ARG NODE_VERSION=16

WORKDIR /var/www/html

ENV DEBIAN_FRONTEND noninteractive
ENV TZ=UTC

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update \
    && apt-get install -y gnupg gosu curl ca-certificates cron zip unzip libzip-dev git supervisor libcap2-bin libpng-dev python2 \
    && apt-get install -y apache2 libapache2-mod-xsendfile \
    && apt-get install -y libldap2-dev \
    && apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev  \
    && docker-php-ext-configure gd --with-freetype=/usr/include/ --with-jpeg=/usr/include/ \
    && docker-php-ext-install -j$(nproc) bcmath pdo_mysql ldap zip gd \
    && php -r "readfile('https://getcomposer.org/installer');" | php -- --install-dir=/usr/bin/ --filename=composer \
    && curl -sL https://deb.nodesource.com/setup_$NODE_VERSION.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Enable PHP modules
RUN a2enmod rewrite headers alias proxy proxy_fcgi

# Copy start script
COPY ./docker/app/entrypoint /usr/local/bin/entrypoint
COPY ./docker/app/wait-for-it /usr/local/bin/wait-for-it
RUN chmod +x /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/wait-for-it

# Copy supervisor config
COPY ./docker/app/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy apache default site conf
COPY ./docker/app/apache/000-default.conf /etc/apache2/sites-enabled/000-default.conf

# Copy php config files
COPY ./docker/app/php/zz-docker.conf /usr/local/etc/php-fpm.d/zz-docker.conf
COPY ./docker/app/php/php.ini /usr/local/etc/php/conf.d/99-app.ini

# Copy cron file to the cron.d directory
COPY ./docker/app/cron/schedule /etc/cron.d/schedule
RUN chmod 0644 /etc/cron.d/schedule
RUN crontab /etc/cron.d/schedule
RUN touch /var/log/cron.log

# Copy ldap config files
COPY ./docker/app/ldap/ /etc/ldap

RUN mkdir /var/www/.npm
RUN chown www-data:www-data /var/www/.npm

COPY --chown=www-data:www-data ./ /var/www/html

USER www-data

RUN npm install
RUN npm run production
RUN composer install

USER root

EXPOSE 80

ENTRYPOINT ["entrypoint"]
