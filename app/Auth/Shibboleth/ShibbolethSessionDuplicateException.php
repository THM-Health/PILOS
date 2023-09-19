<?php

namespace App\Auth\Shibboleth;

/**
 * Exception thrown when a shibboleth session already exists during a login attempt
 */
class ShibbolethSessionDuplicateException extends \Exception
{
    public function __construct()
    {
        $message = 'Shibboleth session already exists.';
        parent::__construct($message);
    }
}
