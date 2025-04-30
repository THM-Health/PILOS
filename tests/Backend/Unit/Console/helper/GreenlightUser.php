<?php

namespace Tests\Backend\Unit\Console\helper;

class GreenlightUser
{
    /**
     * GreenlightUser constructor.
     */
    public function __construct(public $id, public $provider, public $name, public $username, public $social_uid, public $email, public $password_digest) {}
}
