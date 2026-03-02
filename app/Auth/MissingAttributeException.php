<?php

declare(strict_types=1);

namespace App\Auth;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MissingAttributeException extends \Exception
{
    public function __construct(string $attribute)
    {
        $message = "Missing attribute: $attribute";
        parent::__construct($message);
    }

    public function render(Request $request): JsonResponse
    {
        abort(500, __('auth.error.missing_attributes'));
    }
}
