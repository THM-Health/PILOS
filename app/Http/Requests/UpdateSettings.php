<?php

namespace App\Http\Requests;

use App\Enums\LinkButtonStyle;
use App\Enums\LinkTarget;
use App\Enums\TimePeriod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSettings extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        // List of retention periods that are disabled because they are larger than the maximum retention period
        $disabledRecordingRetentionPeriods = [];
        if (config('recording.max_retention_period') !== -1) {
            $disabledRecordingRetentionPeriods[] = TimePeriod::UNLIMITED;

            foreach (TimePeriod::cases() as $timePeriod) {
                if ($timePeriod->value > config('recording.max_retention_period')) {
                    $disabledRecordingRetentionPeriods[] = $timePeriod;
                }
            }
        }

        return [
            'general_name' => ['required', 'string', 'max:255'],
            'general_pagination_page_size' => ['required', 'numeric', 'min:1', 'max:100'],
            'general_default_timezone' => ['required', 'string', Rule::in(timezone_identifiers_list())],
            'general_toast_lifetime' => ['required', 'numeric', 'min:0', 'max:30'],
            'general_help_url' => ['nullable', 'string', 'url', 'max:255'],
            'general_legal_notice_url' => ['nullable', 'string', 'url', 'max:255'],
            'general_privacy_policy_url' => ['nullable', 'string', 'url', 'max:255'],
            'general_no_welcome_page' => ['required', 'boolean'],

            'theme_logo' => ['required_without:theme_logo_file', 'string', 'max:255'],
            'theme_logo_file' => ['required_without:theme_logo', 'image:allow_svg', 'max:500'], // 500 KB, larger files are bad for loading times
            'theme_logo_dark' => ['required_without:theme_logo_dark_file', 'string', 'max:255'],
            'theme_logo_dark_file' => ['required_without:theme_logo_dark', 'image:allow_svg', 'max:500'], // 500 KB, larger files are bad for loading times
            'theme_favicon' => ['required_without:theme_favicon_file', 'string', 'max:255'],
            'theme_favicon_file' => ['required_without:theme_favicon', 'mimes:ico', 'max:500'], // 500 KB, larger files are bad for loading times
            'theme_favicon_dark' => ['required_without:theme_favicon_dark_file', 'string', 'max:255'],
            'theme_favicon_dark_file' => ['required_without:theme_favicon_dark', 'mimes:ico', 'max:500'], // 500 KB, larger files are bad for loading times
            'theme_primary_color' => ['required', 'string', 'hex_color'],
            'theme_rounded' => ['required', 'boolean'],

            'banner_enabled' => ['required', 'boolean'],
            'banner_title' => ['nullable', 'string', 'max:255'],
            'banner_message' => ['nullable', Rule::requiredIf($this->boolean('banner_enabled')), 'string', 'max:500'],
            'banner_link' => ['nullable', 'string', 'url', 'max:255'],
            'banner_link_text' => ['nullable', 'string', 'max:255'],
            'banner_link_style' => ['required', 'string', 'max:255', Rule::enum(LinkButtonStyle::class)->except(LinkButtonStyle::getDeprecated())],
            'banner_link_target' => ['required', 'string', 'max:255', Rule::enum(LinkTarget::class)],
            'banner_icon' => ['nullable', 'string', 'max:255', 'regex:/^(fas|fa\\-solid) fa\\-([a-z0-9]+(?(?=\\-)\\-[a-z0-9]+)*)$/'],
            'banner_color' => ['nullable', Rule::requiredIf($this->boolean('banner_enabled')), 'string', 'hex_color'],
            'banner_background' => ['nullable', Rule::requiredIf($this->boolean('banner_enabled')), 'string', 'hex_color'],

            'room_limit' => ['required', 'numeric', 'min:-1', 'max:100'],
            'room_token_expiration' => ['required', 'numeric', Rule::enum(TimePeriod::class)],
            'room_auto_delete_inactive_period' => ['required', 'numeric', Rule::enum(TimePeriod::class)],
            'room_auto_delete_never_used_period' => ['required', 'numeric', Rule::enum(TimePeriod::class)],
            'room_auto_delete_deadline_period' => ['required', 'numeric', Rule::enum(TimePeriod::class)->only([TimePeriod::ONE_WEEK, TimePeriod::TWO_WEEKS, TimePeriod::ONE_MONTH])],
            'room_file_terms_of_use' => ['nullable', 'string', 'max:65000'],

            'user_password_change_allowed' => ['required', 'boolean'],

            'recording_server_usage_enabled' => ['required', 'boolean'],
            'recording_server_usage_retention_period' => ['required', 'numeric', Rule::enum(TimePeriod::class)],
            'recording_meeting_usage_enabled' => ['required', 'boolean'],
            'recording_meeting_usage_retention_period' => ['required', 'numeric', Rule::enum(TimePeriod::class)],
            'recording_attendance_retention_period' => ['required', 'numeric', Rule::enum(TimePeriod::class)],
            'recording_recording_retention_period' => ['required', 'numeric',  Rule::enum(TimePeriod::class)->except($disabledRecordingRetentionPeriods)],

            'bbb_logo' => ['nullable', 'string', 'max:255'],
            'bbb_logo_file' => ['image:allow_svg', 'max:500'],
            'bbb_logo_dark' => ['nullable', 'string', 'max:255'],
            'bbb_logo_dark_file' => ['image:allow_svg', 'max:500'],

            'bbb_style' => ['nullable', 'file', 'max:500', 'extensions:css'],
            'bbb_default_presentation' => ['nullable', 'file', 'max:'.(config('bigbluebutton.max_filesize') * 1000), 'mimes:'.config('bigbluebutton.allowed_file_mimes')],
        ];
    }
}
