<?php

namespace App\Http\Resources;

use App\Settings\BannerSettings;
use App\Settings\GeneralSettings;
use App\Settings\RecordingSettings;
use App\Settings\RoomSettings;
use App\Settings\ThemeSettings;
use App\Settings\UserSettings;
use Illuminate\Http\Resources\Json\JsonResource;

class Config extends JsonResource
{
    public function __construct()
    {
        parent::__construct(null);
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
        $theme = app(ThemeSettings::class);

        return [
            'general' => [
                'name' => $generalSettings->name,
                'pagination_page_size' => $generalSettings->pagination_page_size,
                'toast_lifetime' => $generalSettings->toast_lifetime,
                'default_timezone' => $generalSettings->default_timezone,
                'help_url' => $generalSettings->help_url,
                'legal_notice_url' => $generalSettings->legal_notice_url,
                'privacy_policy_url' => $generalSettings->privacy_policy_url,
                'default_locale' => config('app.locale'),
                'enabled_locales' => array_map(function ($locale) {
                    return $locale['name'];
                }, config('app.enabled_locales')),
                'version' => config('app.version'),
                'whitelabel' => config('app.whitelabel'),
                'base_url' => config('app.url'),
            ],
            'theme' => [
                'logo' => $theme->logo,
                'logo_dark' => $theme->logo_dark,
                'favicon' => $theme->favicon,
                'favicon_dark' => $theme->favicon_dark,
                'primary_color' => $theme->primary_color,
                'rounded' => $theme->rounded,
            ],
            'room' => [
                'limit' => $roomSettings->limit,
                'token_expiration' => $roomSettings->token_expiration,
                'refresh_rate' => config('bigbluebutton.room_refresh_rate'),
            ],
            'user' => [
                'password_change_allowed' => $userSettings->password_change_allowed,
            ],
            'bbb' => [
                'file_mimes' => config('bigbluebutton.allowed_file_mimes'),
                'max_filesize' => config('bigbluebutton.max_filesize'),
                'room_name_limit' => config('bigbluebutton.room_name_limit'),
                'welcome_message_limit' => config('bigbluebutton.welcome_message_limit'),
            ],
            'monitor' => [
                'horizon' => true,
                'pulse' => true,
                'telescope' => config('telescope.enabled'),
            ],
            'banner' => [
                'enabled' => $bannerSettings->enabled,
                $this->mergeWhen($bannerSettings->enabled, [
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
            'recording' => [
                'meeting_usage_enabled' => $recordingSettings->meeting_usage_enabled,
                'meeting_usage_retention_period' => $recordingSettings->meeting_usage_retention_period,
                'attendance_retention_period' => $recordingSettings->attendance_retention_period,
                'recording_retention_period' => $recordingSettings->recording_retention_period,
                'recording_description_limit' => config('recording.description_limit'),
            ],
            'auth' => [
                'local' => config('auth.local.enabled'),
                'ldap' => config('ldap.enabled'),
                'shibboleth' => config('services.shibboleth.enabled'),
                'oidc' => config('services.oidc.enabled'),
            ],
        ];
    }
}
