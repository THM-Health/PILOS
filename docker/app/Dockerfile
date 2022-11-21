FROM php:8.1-fpm-bullseye

LABEL maintainer="Samuel Weirich"
LABEL description="Development container for PILOS, compatible with laravel sail; heavily inspired by offical image"

ARG NODE_VERSION=16

WORKDIR /var/www/html

ENV DEBIAN_FRONTEND noninteractive
ENV TZ=UTC

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update \
    && apt-get install -y gnupg gosu curl ca-certificates zip unzip libzip-dev git supervisor libcap2-bin libpng-dev python2 \
    && apt-get install -y apache2 libapache2-mod-xsendfile \
    && apt-get install -y default-mysql-client libpq-dev \
    && apt-get install -y libldap2-dev \
    && apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev  \
    && docker-php-ext-configure gd --with-freetype=/usr/include/ --with-jpeg=/usr/include/ \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \
    && docker-php-ext-install -j$(nproc) bcmath pdo_mysql pdo_pgsql pgsql ldap zip gd \
    && pecl install xdebug-3.1.5 \
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
RUN chmod +x /usr/local/bin/entrypoint

# Copy scheduler script
COPY ./docker/app/scheduler /usr/local/etc/scheduler
RUN chmod +x /usr/local/etc/scheduler/run.sh

# Copy larave mix wrapper script
COPY ./docker/app/laravel-mix /usr/local/etc/laravel-mix
RUN chmod +x /usr/local/etc/laravel-mix/run.sh
RUN chown www-data:www-data /usr/local/etc/laravel-mix/

# Copy supervisor config
COPY ./docker/app/supervisord/ /etc/supervisor/conf.d

# Copy apache default site conf
COPY ./docker/app/apache/000-default.conf /etc/apache2/sites-enabled/000-default.conf

# Copy php config files
COPY ./docker/app/php/zz-docker.conf /usr/local/etc/php-fpm.d/zz-docker.conf
COPY ./docker/app/php/php.ini /usr/local/etc/php/conf.d/99-app.ini

# Copy ldap config files
COPY ./docker/app/ldap/ /etc/ldap

# Create npm cache folder
RUN mkdir /var/www/.npm
RUN chown www-data:www-data /var/www/.npm

# Copy application files
COPY --chown=www-data:www-data ./ /var/www/html

USER www-data
# Run npm and composer install as www-data user
RUN npm install
RUN composer install

USER root

EXPOSE 80
EXPOSE 5173

ENTRYPOINT ["entrypoint"]
