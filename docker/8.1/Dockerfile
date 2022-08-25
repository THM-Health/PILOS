FROM php:8.1-fpm-bullseye

LABEL maintainer="Samuel Weirich"
LABEL description="Development container for PILOS, compatible with laravel sail; heavily inspired by offical image"

ARG WWWGROUP
ARG NODE_VERSION=16
ARG POSTGRES_VERSION=14

WORKDIR /var/www/html

ENV DEBIAN_FRONTEND noninteractive
ENV TZ=UTC

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update \
    && apt-get install -y gnupg gosu curl ca-certificates zip unzip libzip-dev git supervisor libcap2-bin libpng-dev python2 \
    && apt-get install -y apache2 libapache2-mod-xsendfile \
    && apt-get install -y libldap2-dev \
    && mkdir -p ~/.gnupg \
    && chmod 600 ~/.gnupg \
    && echo "disable-ipv6" >> ~/.gnupg/dirmngr.conf \
    && apt-get update \
    && apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev  \
    && docker-php-ext-configure gd --with-freetype=/usr/include/ --with-jpeg=/usr/include/ \
    && docker-php-ext-install -j$(nproc) bcmath pdo_mysql ldap zip gd \
    && php -r "readfile('https://getcomposer.org/installer');" | php -- --install-dir=/usr/bin/ --filename=composer \
    && curl -sL https://deb.nodesource.com/setup_$NODE_VERSION.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm \
    && apt-get install -y sqlite3 default-mysql-client \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN groupadd --force -g $WWWGROUP sail
RUN useradd -ms /bin/bash --no-user-group -g $WWWGROUP -u 1337 sail

# Enable PHP modules
RUN a2enmod rewrite
RUN a2enmod headers
RUN a2enmod alias proxy proxy_fcgi

# Set Apache user
RUN sed -rie 's|export APACHE_RUN_USER=.*|export APACHE_RUN_USER=sail|g' /etc/apache2/envvars; \
    sed -rie 's|export APACHE_RUN_GROUP=.*|export APACHE_RUN_GROUP=sail|g' /etc/apache2/envvars;

# Copy start script
COPY start-container /usr/local/bin/start-container
RUN chmod +x /usr/local/bin/start-container

# Copy supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy apache default site conf
COPY 000-default.conf /etc/apache2/sites-enabled/000-default.conf

# Copy php config files
COPY php/zz-docker.conf /usr/local/etc/php-fpm.d/zz-docker.conf
COPY php/php.ini /usr/local/etc/php/conf.d/99-app.ini

# Copy ldap config files
COPY ldap/ /etc/ldap

EXPOSE 80

ENTRYPOINT ["start-container"]
