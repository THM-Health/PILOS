<?php

namespace App\Auth\OIDC;

class InvalidConfiguration extends \Exception
{
    public function __construct()
    {
        parent::__construct('OIDC configuration could not be retrieved: invalid response from discovery endpoint');
    }
}
