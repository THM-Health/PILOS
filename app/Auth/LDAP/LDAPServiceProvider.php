<?php

namespace App\Auth\LDAP;

use Config;
use Illuminate\Support\ServiceProvider;
use LdapRecord\Connection;
use LdapRecord\Container;
use Log;

class LDAPServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->registerLogging();

        Container::setDefaultConnection('default');
        Container::addConnection(new Connection(Config::get('ldap.connection')));
    }

    /**
     * Register the LDAP operation logger.
     *
     * @return void
     */
    protected function registerLogging()
    {
        if (! Config::get('ldap.enabled.logging', false)) {
            return;
        }

        /** @var \Illuminate\Log\LogManager|null $logger */
        if (is_null($logger = Log::getFacadeRoot())) {
            return;
        }

        Container::getInstance()->setLogger($logger);
    }
}
