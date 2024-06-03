<?php

namespace App\Http\Resources;

use App\Enums\LinkButtonStyle;
use App\Enums\LinkTarget;
use App\Settings\BannerSettings;
use App\Settings\BigBlueButtonSettings;
use App\Settings\GeneralSettings;
use App\Settings\RecordingSettings;
use App\Settings\RoomSettings;
use App\Settings\UserSettings;
use Illuminate\Http\Resources\Json\JsonResource;

class ApplicationSettings extends JsonResource
{
    /**
     * @var bool Flag that indicates whether all settings should be send.
     */
    private $allSettings = false;

    public function __construct()
    {
        parent::__construct(null);
    }

    /**
     * Sets the flag to send all settings to the client.
     *
     * @return $this The application settings resource instance
     */
    public function allSettings()
    {
        $this->allSettings = true;

        return $this;
    }

    /**
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        $generalSettings = app(GeneralSettings::class);
        $bannerSettings = app(BannerSettings::class);
        $roomSettings = app(RoomSettings::class);
        $userSettings = app(UserSettings::class);
        $recordingSettings = app(RecordingSettings::class);
        $bigBlueButtonSettings = app(BigBlueButtonSettings::class);

        return [
            'version' => config('app.version'),
            'whitelabel' => config('app.whitelabel'),
            'base_url' => config('app.url'),
            'name' => $generalSettings->name,
            'logo' => $generalSettings->logo,
            'favicon' => $generalSettings->favicon,
            'room_limit' => $roomSettings->limit,
            'pagination_page_size' => $generalSettings->pagination_page_size,
            'room_pagination_page_size' => $roomSettings->pagination_page_size,
            'password_change_allowed' => $userSettings->password_change_allowed,
            'toast_lifetime' => $generalSettings->toast_lifetime,
            'default_locale' => config('app.locale'),
            'enabled_locales' => array_map(function ($locale) {
                return $locale['name'];
            }, config('app.enabled_locales')),
            'default_timezone' => $generalSettings->default_timezone,
            'bbb' => [
                'file_mimes' => config('bigbluebutton.allowed_file_mimes'),
                'max_filesize' => config('bigbluebutton.max_filesize'),
                'room_name_limit' => config('bigbluebutton.room_name_limit'),
                'welcome_message_limit' => config('bigbluebutton.welcome_message_limit'),
                $this->mergeWhen($this->allSettings, [
                    'style' => $bigBlueButtonSettings->style,
                    'logo' => $bigBlueButtonSettings->logo,
                    'default_presentation' => $bigBlueButtonSettings->default_presentation,
                ]),
            ],
            'monitor' => [
                'horizon' => true,
                'pulse' => true,
                'telescope' => config('telescope.enabled'),
            ],
            'banner' => [
                'enabled' => $bannerSettings->enabled,
                $this->mergeWhen($bannerSettings->enabled || $this->allSettings, [
                    'message' => $bannerSettings->message,
                    'link' => $bannerSettings->link,
                    'icon' => $bannerSettings->icon,
                    'color' => $bannerSettings->color,
                    'background' => $bannerSettings->background,
                    'title' => $bannerSettings->title,
                    'link_style' => $bannerSettings->link_style,
                    'link_text' => $bannerSettings->link_text,
                    'link_target' => $bannerSettings->link_target,
                ]),
            ],
            $this->mergeWhen($this->allSettings, [
                'link_btn_styles' => LinkButtonStyle::cases(),
                'link_targets' => LinkTarget::cases(),
                'room_auto_delete' => [
                    'inactive_period' => $roomSettings->auto_delete_inactive_period,
                    'never_used_period' => $roomSettings->auto_delete_never_used_period,
                    'deadline_period' => $roomSettings->auto_delete_deadline_period,
                ],
            ]),
            'help_url' => $generalSettings->help_url,
            'legal_notice_url' => $generalSettings->legal_notice_url,
            'privacy_policy_url' => $generalSettings->privacy_policy_url,
            'statistics' => [
                $this->mergeWhen($this->allSettings, [
                    'servers' => [
                        'enabled' => $recordingSettings->server_usage_enabled,
                        'retention_period' => $recordingSettings->server_usage_retention_period,
                    ],
                ]),
                'meetings' => [
                    'enabled' => $recordingSettings->meeting_usage_enabled,
                    'retention_period' => $recordingSettings->meeting_usage_retention_period,
                ],
            ],
            'recording' => [
                'retention_period' => $recordingSettings->recording_retention_period,
                'max_retention_period' => config('recording.max_retention_period'),
                'description_limit' => config('recording.description_limit'),
            ],
            'attendance' => [
                'retention_period' => $recordingSettings->attendance_retention_period,
            ],
            'room_token_expiration' => $roomSettings->token_expiration,
            'auth' => [
                'local' => config('auth.local.enabled'),
                'ldap' => config('ldap.enabled'),
                'shibboleth' => config('services.shibboleth.enabled'),
            ],
            'room_refresh_rate' => config('bigbluebutton.room_refresh_rate'),
        ];
    }
}
