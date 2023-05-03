<?php

namespace Tests\Unit;

use App\Auth\ExternalUser;
use App\Auth\MissingAttributeException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Log;
use Tests\TestCase;
use TiMacDonald\Log\LogEntry;
use TiMacDonald\Log\LogFake;

class ExternalUserTest extends TestCase
{
    use RefreshDatabase;

    public function setUp(): void
    {
        parent::setUp();

        Log::swap(new LogFake());
    }

    public function testMissingExternalIdAttributes()
    {
        $this->expectException(MissingAttributeException::class);
        $this->expectExceptionMessage('Missing attribute: external_id');

        try {
            new class extends ExternalUser {
                public function __construct()
                {
                    $this->addAttributeValue('external_id', null);
                    $this->addAttributeValue('first_name', 'John');
                    $this->addAttributeValue('last_name', 'Doe');
                    $this->addAttributeValue('email', 'john.doe@domain.org');
                    parent::__construct();
                }
            };
        } catch(MissingAttributeException $e) {
            Log::assertLogged(
                fn (LogEntry $log) =>
                    $log->level === 'error'
                    && $log->message == 'Required attribute missing'
                    && $log->context['attribute'] == 'external_id'
            );

            throw $e;
        }
    }

    public function testMissingFirstnameAttributes()
    {
        $this->expectException(MissingAttributeException::class);
        $this->expectExceptionMessage('Missing attribute: first_name');

        try {
            new class extends ExternalUser {
                public function __construct()
                {
                    $this->addAttributeValue('external_id', 'jdoe');
                    $this->addAttributeValue('first_name', null);
                    $this->addAttributeValue('last_name', 'Doe');
                    $this->addAttributeValue('email', 'john.doe@domain.org');
                    parent::__construct();
                }
            };
        } catch(MissingAttributeException $e) {
            Log::assertLogged(
                fn (LogEntry $log) =>
                    $log->level === 'error'
                    && $log->message == 'Required attribute missing'
                    && $log->context['attribute'] == 'first_name'
            );

            throw $e;
        }
    }

    public function testMissingLastnameAttributes()
    {
        $this->expectException(MissingAttributeException::class);
        $this->expectExceptionMessage('Missing attribute: last_name');

        try {
            new class extends ExternalUser {
                public function __construct()
                {
                    $this->addAttributeValue('external_id', 'jdoe');
                    $this->addAttributeValue('first_name', 'John');
                    $this->addAttributeValue('last_name', null);
                    $this->addAttributeValue('email', 'john.doe@domain.org');
                    parent::__construct();
                }
            };
        } catch(MissingAttributeException $e) {
            Log::assertLogged(
                fn (LogEntry $log) =>
                    $log->level === 'error'
                    && $log->message == 'Required attribute missing'
                    && $log->context['attribute'] == 'last_name'
            );

            throw $e;
        }
    }

    public function testMissingEmailAttributes()
    {
        $this->expectException(MissingAttributeException::class);
        $this->expectExceptionMessage('Missing attribute: email');

        try {
            new class extends ExternalUser {
                public function __construct()
                {
                    $this->addAttributeValue('external_id', 'jdoe');
                    $this->addAttributeValue('first_name', 'John');
                    $this->addAttributeValue('last_name', 'Doe');
                    $this->addAttributeValue('email', null);
                    parent::__construct();
                }
            };
        } catch(MissingAttributeException $e) {
            Log::assertLogged(
                fn (LogEntry $log) =>
                    $log->level === 'error'
                    && $log->message == 'Required attribute missing'
                    && $log->context['attribute'] == 'email'
            );

            throw $e;
        }
    }
}
