<?php

declare(strict_types=1);

namespace App\Auth\LDAP;

use Illuminate\Log\LogManager;
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
        Container::addConnection(new Connection(config('ldap.connection')));
    }

    /**
     * Register the LDAP operation logger.
     *
     * @return void
     */
    protected function registerLogging()
    {
        if (! config('ldap.logging.enabled', false)) {
            return;
        }

        /** @var LogManager|null $logger */
        if (is_null($logger = Log::getFacadeRoot())) {
            return;
        }

        Container::getInstance()->setLogger($logger);
    }
}
