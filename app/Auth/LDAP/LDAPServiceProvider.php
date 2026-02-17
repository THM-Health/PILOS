<?php

namespace App\Auth\LDAP;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use LdapRecord\Connection;
use LdapRecord\Container;

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
        if (! Config::get('ldap.logging.enabled', false)) {
            return;
        }

        /** @var \Illuminate\Log\LogManager|null $logger */
        if (is_null($logger = Log::getFacadeRoot())) {
            return;
        }

        Container::getInstance()->setLogger($logger);
    }
}
