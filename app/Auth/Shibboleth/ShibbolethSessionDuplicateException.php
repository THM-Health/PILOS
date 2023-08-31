<?php

namespace App\Auth\Shibboleth;

class ShibbolethSessionDuplicateException extends \Exception
{
    public function __construct()
    {
        $message = 'Shibboleth session already exists.';
        parent::__construct($message);
    }
}
