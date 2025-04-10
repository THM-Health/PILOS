<?php

namespace App\Rules;

use App\Services\MeetingService;
use BigBlueButton\Enum\Role;
use BigBlueButton\Parameters\JoinMeetingParameters;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class CustomJoinMeetingParameters implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $meetingParams = new JoinMeetingParameters('demo', 'demo', Role::MODERATOR);
        $errors = MeetingService::setCustomJoinMeetingParameters($meetingParams, $value);
        foreach ($errors as $error) {
            $fail($error);
        }
    }
}
