<?php

namespace App\Auth\OIDC;

use Exception;

class NetworkIssue extends \Exception
{
    public function __construct(Exception $e)
    {
        parent::__construct('OIDC configuration could not be retrieved:'.$e->getMessage());
    }
}
