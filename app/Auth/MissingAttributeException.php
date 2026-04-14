<?php

declare(strict_types=1);

namespace App\Auth;

class MissingAttributeException extends \Exception
{
    public function __construct(string $attribute)
    {
        $message = "Missing attribute: $attribute";
        parent::__construct($message);
    }
}
