<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use LdapRecord\Laravel\Testing\DirectoryEmulator;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function tearDown(): void
    {
        DirectoryEmulator::teardown();

        parent::tearDown();
    }
}
