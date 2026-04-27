<?php

declare(strict_types=1);

namespace Tests\Backend\Unit\Console\helper;

class Greenlight2User
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
    public function __construct(int $id, string $provider, string $name, ?string $username, ?string $social_uid, string $email, ?string $password_digest)
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
