<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\LinkButtonStyle;
use App\Enums\LinkTarget;
use App\Enums\TimePeriod;
use App\Rules\Antivirus;
use App\Rules\Image;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class UpdateSettingsRequest extends FormRequest
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
            'general_default_timezone' => ['required', Rule::in(timezone_identifiers_list())],
            'general_toast_lifetime' => ['required', 'numeric', 'min:0', 'max:30'],
            'general_help_url' => ['nullable', 'string', 'url', 'max:255'],
            'general_legal_notice_url' => ['nullable', 'string', 'url', 'max:255'],
            'general_privacy_policy_url' => ['nullable', 'string', 'url', 'max:255'],
            'general_accessibility_statement_url' => ['nullable', 'string', 'url', 'max:255'],
            'general_no_welcome_page' => ['required', 'boolean'],

            'theme_logo' => ['required_without:theme_logo_file', 'string', 'max:255'],
            'theme_logo_file' => ['bail', 'required_without:theme_logo', Image::logo(), new Antivirus],
            'theme_logo_dark' => ['required_without:theme_logo_dark_file', 'string', 'max:255'],
            'theme_logo_dark_file' => ['bail', 'required_without:theme_logo_dark', Image::logo(), new Antivirus],
            'theme_favicon' => ['required_without:theme_favicon_file', 'string', 'max:255'],
            'theme_favicon_file' => ['bail', 'required_without:theme_favicon', Image::favicon(), new Antivirus],
            'theme_favicon_dark' => ['required_without:theme_favicon_dark_file', 'string', 'max:255'],
            'theme_favicon_dark_file' => ['bail', 'required_without:theme_favicon_dark', Image::favicon(), new Antivirus],
            'theme_primary_color' => ['required', 'string', 'hex_color'],
            'theme_rounded' => ['required', 'boolean'],
            'theme_custom_css' => ['bail', 'nullable', File::types(['css', 'txt'])->extensions('css')->max('500kb'), new Antivirus],

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
            'room_personalized_link_expiration' => ['required', 'numeric', Rule::enum(TimePeriod::class)],
            'room_auto_delete_inactive_period' => ['required', 'numeric', Rule::enum(TimePeriod::class)],
            'room_auto_delete_never_used_period' => ['required', 'numeric', Rule::enum(TimePeriod::class)],
            'room_auto_delete_deadline_period' => ['required', 'numeric', Rule::enum(TimePeriod::class)->only([TimePeriod::ONE_WEEK, TimePeriod::TWO_WEEKS, TimePeriod::ONE_MONTH])],
            'room_file_terms_of_use' => ['nullable', 'string', 'max:65000'],
            'room_hide_owner_from_guests' => ['required', 'boolean'],

            'user_password_change_allowed' => ['required', 'boolean'],

            'recording_server_usage_enabled' => ['required', 'boolean'],
            'recording_server_usage_retention_period' => ['required', 'numeric', Rule::enum(TimePeriod::class)],
            'recording_meeting_usage_enabled' => ['required', 'boolean'],
            'recording_meeting_usage_retention_period' => ['required', 'numeric', Rule::enum(TimePeriod::class)],
            'recording_attendance_retention_period' => ['required', 'numeric', Rule::enum(TimePeriod::class)],
            'recording_recording_retention_period' => ['required', 'numeric',  Rule::enum(TimePeriod::class)->except($disabledRecordingRetentionPeriods)],

            'bbb_logo' => ['nullable', 'string', 'max:255'],
            'bbb_logo_file' => ['bail', Image::logo(), new Antivirus],
            'bbb_logo_dark' => ['nullable', 'string', 'max:255'],
            'bbb_logo_dark_file' => ['bail', Image::logo(), new Antivirus],

            'bbb_style' => ['bail', 'nullable', File::types(['css', 'txt'])->extensions('css')->max('500kb'), new Antivirus], // 500 KB, larger files are bad for loading times
            'bbb_default_presentation' => ['bail', 'nullable', File::types(config('bigbluebutton.allowed_file_mimes'))->extensions(config('bigbluebutton.allowed_file_mimes'))->max(config('bigbluebutton.max_filesize').'mb'), new Antivirus],
            'bbb_default_welcome_message' => ['bail', 'nullable', 'max:'.config('bigbluebutton.welcome_message_limit'), 'string'],
        ];
    }
}
