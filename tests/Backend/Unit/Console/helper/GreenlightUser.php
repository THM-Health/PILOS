<?php

namespace Tests\Backend\Unit\Console\helper;

class GreenlightUser
{
    public $id;

    public $provider;

    public $name;

    public $username;

    public $social_uid;

    public $email;

    public $password_digest;

    /**
     * GreenlightUser constructor.
     */
    public function __construct($id, $provider, $name, $username, $social_uid, $email, $password_digest)
    {
        $this->id = $id;
        $this->provider = $provider;
        $this->name = $name;
        $this->username = $username;
        $this->social_uid = $social_uid;
        $this->email = $email;
        $this->password_digest = $password_digest;
    }
}
