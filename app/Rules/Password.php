<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Password implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Password should contain at least 1 uppercase letter, 1 lowercase letter, 1 symbol, 1 number
        $valid = preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*(_|[^\w])).+$/', $value) !== 0;

        if ($valid) {
            return;
        }

        $fail(__('validation.custom.password'));
    }
}
