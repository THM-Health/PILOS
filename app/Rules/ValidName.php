<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidName implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (preg_match('/^['.config('bigbluebutton.allowed_name_characters').']+$/u', $value)) {
            return;
        }

        $failedChars = array_unique(str_split(preg_replace('/['.config('bigbluebutton.allowed_name_characters').']+/u', '', $value)));

        $invalidChars = implode('', $failedChars);
        $validUTF8 = mb_check_encoding($invalidChars, 'UTF-8');
        if ($validUTF8) {
            $fail(trans_choice('validation.validname', mb_strlen($invalidChars, 'UTF-8'), ['attribute' => __('validation.attributes.'.$attribute), 'chars' => $invalidChars]));
        } else {
            $fail(__('validation.validname_error', ['attribute' => __('validation.attributes.'.$attribute)]));
        }

    }
}
