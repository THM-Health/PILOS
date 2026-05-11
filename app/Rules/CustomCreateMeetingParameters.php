<?php

declare(strict_types=1);

namespace App\Rules;

use App\Services\MeetingService;
use BigBlueButton\Parameters\CreateMeetingParameters;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class CustomCreateMeetingParameters implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  Closure(string): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $meetingParams = new CreateMeetingParameters('demo', 'demo');
        $errors = MeetingService::setCustomCreateMeetingParameters($meetingParams, $value);
        foreach ($errors as $error) {
            $fail($error);
        }
    }
}
