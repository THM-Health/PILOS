FROM php:8.3-fpm-bullseye

LABEL maintainer="Samuel Weirich"
LABEL description="Development container for PILOS, compatible with laravel sail; heavily inspired by offical image"

ARG NODE_VERSION=18
ARG WWWGROUP=33
ARG WWWUSER=33

WORKDIR /var/www/html

ENV DEBIAN_FRONTEND noninteractive
ENV TZ=UTC

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update \
    && mkdir -p /etc/apt/keyrings \
    && apt-get install -y gnupg gosu curl ca-certificates zip unzip pv libzip-dev git supervisor libcap2-bin libpng-dev python2 \
    && apt-get install -y libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2 libxtst6 xauth xvfb \
    && apt-get install -y nginx \
    && apt-get install -y default-mysql-client postgresql-client libpq-dev \
    && apt-get install -y libldap2-dev libxml2-dev libpq-dev \
    && apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev  \
    && docker-php-ext-configure gd --with-freetype=/usr/include/ --with-jpeg=/usr/include/ \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \
    && docker-php-ext-install -j$(nproc) bcmath pdo_mysql pdo_pgsql pgsql ldap zip gd opcache soap \
    && pecl install xdebug-3.3.0 \
    && php -r "readfile('https://getcomposer.org/installer');" | php -- --install-dir=/usr/bin/ --filename=composer \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_VERSION.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y nodejs \
    && npm install -g npm \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN usermod -d /var/www www-data
RUN chown www-data:www-data /var/www/


RUN usermod -u $WWWUSER www-data
RUN groupmod -o -g $WWWGROUP www-data

# Copy start script
COPY ./docker/app/entrypoint /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

# Copy scheduler script
COPY ./docker/app/scheduler /usr/local/etc/scheduler
RUN chmod +x /usr/local/etc/scheduler/run.sh

# Copy frontend wrapper script
COPY ./docker/app/frontend /usr/local/etc/frontend
RUN chmod +x /usr/local/etc/frontend/run.sh
RUN chown www-data:www-data /usr/local/etc/frontend/

# Copy supervisor config
COPY ./docker/app/supervisord/ /etc/supervisor/conf.d

# Enable nginx site
COPY ./docker/app/nginx/sites-available /etc/nginx/sites-available
COPY ./docker/app/nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./docker/app/nginx/snippets-available /etc/nginx/snippets-available
RUN rm /etc/nginx/sites-enabled/default
RUN ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Increase limits
RUN echo 'www-data soft nofile 65535' >> /etc/security/limits.conf
RUN echo 'www-data hard nofile 65535' >> /etc/security/limits.conf
RUN echo 'ULIMIT="-n 65535"' >> /etc/default/nginx

# Copy php config files
COPY ./docker/app/php/zz-docker.conf /usr/local/etc/php-fpm.d/zz-docker.conf
COPY ./docker/app/php/php.ini /usr/local/etc/php/conf.d/99-app.ini
COPY ./docker/app/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
RUN mkdir -p /var/log/php

# Copy ldap config files
COPY ./docker/app/ldap/ /etc/ldap

# Copy application files
COPY --chown=www-data:www-data ./ /var/www/html

USER www-data
# Run npm and composer install as www-data user
RUN npm install
RUN composer install

USER root

EXPOSE 80
EXPOSE 443

ENTRYPOINT ["entrypoint"]
