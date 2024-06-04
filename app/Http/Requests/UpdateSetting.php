<?php

namespace App\Http\Requests;

use App\Enums\LinkButtonStyle;
use App\Enums\LinkTarget;
use App\Enums\TimePeriod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSetting extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'room_limit' => ['required', 'numeric', 'min:-1', 'max:100'],
            'logo' => ['required_without:logo_file', 'string', 'max:255'],
            'logo_file' => ['required_without:logo', 'image', 'max:500'], // 500 KB, larger files are bad for loading times
            'favicon' => ['required_without:favicon_file', 'string', 'max:255'],
            'favicon_file' => ['required_without:favicon', 'mimes:ico', 'max:500'], // 500 KB, larger files are bad for loading times
            'room_pagination_page_size' => ['required', 'numeric', 'min:1', 'max:25'],
            'pagination_page_size' => ['required', 'numeric', 'min:1', 'max:100'],
            'password_change_allowed' => ['required', 'boolean'],
            'default_timezone' => ['required', 'string', Rule::in(timezone_identifiers_list())],
            'toast_lifetime' => ['required', 'numeric', 'min:0', 'max:30'],
            'banner' => ['required', 'array'],
            'banner.enabled' => ['required', 'boolean'],
            'banner.title' => ['nullable', 'string', 'max:255'],
            'banner.message' => ['nullable', Rule::requiredIf($this->boolean('banner.enabled')), 'string', 'max:500'],
            'banner.link' => ['nullable', 'string', 'url', 'max:255'],
            'banner.link_text' => ['nullable', 'string', 'max:255'],
            'banner.link_style' => ['required', 'string', 'max:255', Rule::enum(LinkButtonStyle::class)],
            'banner.link_target' => ['required', 'string', 'max:255', Rule::enum(LinkTarget::class)],
            'banner.icon' => ['nullable', 'string', 'max:255', 'regex:/^(fas|fa\\-solid) fa\\-([a-z0-9]+(?(?=\\-)\\-[a-z0-9]+)*)$/'],
            'banner.color' => ['nullable', Rule::requiredIf($this->boolean('banner.enabled')), 'string', 'hex_color'],
            'banner.background' => ['nullable', Rule::requiredIf($this->boolean('banner.enabled')), 'string', 'hex_color'],
            'help_url' => ['nullable', 'string', 'url', 'max:255'],
            'legal_notice_url' => ['nullable', 'string', 'url', 'max:255'],
            'privacy_policy_url' => ['nullable', 'string', 'url', 'max:255'],
            'statistics.servers.enabled' => ['required', 'boolean'],
            'statistics.servers.retention_period' => ['required', 'numeric', Rule::enum(TimePeriod::class)],
            'statistics.meetings.enabled' => ['required', 'boolean'],
            'statistics.meetings.retention_period' => ['required', 'numeric', Rule::enum(TimePeriod::class)],
            'attendance.retention_period' => ['required', 'numeric', Rule::enum(TimePeriod::class)],
            'bbb.logo' => ['string', 'max:255'],
            'bbb.logo_file' => ['image', 'max:500'],
            'bbb.style' => ['nullable', 'file', 'max:500'],
            'bbb.default_presentation' => ['nullable', 'file', 'max:'.(config('bigbluebutton.max_filesize') * 1000), 'mimes:'.config('bigbluebutton.allowed_file_mimes')],
            'room_token_expiration' => ['required', 'numeric', Rule::enum(TimePeriod::class)],
            'room_auto_delete.inactive_period' => ['required', 'numeric', Rule::enum(TimePeriod::class)],
            'room_auto_delete.never_used_period' => ['required', 'numeric', Rule::enum(TimePeriod::class)],
            'room_auto_delete.deadline_period' => ['required', 'numeric', Rule::enum(TimePeriod::class)->only([TimePeriod::ONE_WEEK, TimePeriod::TWO_WEEKS, TimePeriod::ONE_MONTH])],
            'recording.retention_period' => ['required', 'numeric',  Rule::enum(TimePeriod::class)->except($disabledRecordingRetentionPeriods)],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'banner.enabled' => __('validation.attributes.banner_enabled'),
            'banner.title' => __('validation.attributes.banner_title'),
            'banner.message' => __('validation.attributes.banner_message'),
            'banner.link' => __('validation.attributes.banner_link'),
            'banner.link_text' => __('validation.attributes.banner_link_text'),
            'banner.link_style' => __('validation.attributes.banner_link_style'),
            'banner.link_target' => __('validation.attributes.banner_link_target'),
            'banner.icon' => __('validation.attributes.banner_icon'),
            'banner.color' => __('validation.attributes.banner_color'),
            'banner.background' => __('validation.attributes.banner_background'),
        ];
    }
}
