<?php

namespace App\Auth;

class MissingAttributeException extends \Exception
{
    public function __construct(string $attribute)
    {
        $message = "Missing attribute: $attribute";
        parent::__construct($message);
    }
}
