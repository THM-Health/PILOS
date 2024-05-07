<?php

namespace App\Http\Resources;

use App\Enums\LinkButtonStyle;
use App\Enums\LinkTarget;
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
        return [
            'version' => config('app.version'),
            'whitelabel' => config('app.whitelabel'),
            'base_url' => config('app.url'),
            'name' => setting('name'),
            'logo' => setting('logo'),
            'favicon' => setting('favicon'),
            'room_limit' => (int) setting('room_limit'),
            'pagination_page_size' => (int) setting('pagination_page_size'),
            'room_pagination_page_size' => (int) setting('room_pagination_page_size'),
            'password_change_allowed' => (bool) setting('password_change_allowed'),
            'default_locale' => config('app.locale'),
            'enabled_locales' => array_map(function ($locale) {
                return $locale['name'];
            }, config('app.enabled_locales')),
            'default_timezone' => setting('default_timezone'),
            'bbb' => [
                'file_mimes' => config('bigbluebutton.allowed_file_mimes'),
                'max_filesize' => (int) config('bigbluebutton.max_filesize'),
                'room_name_limit' => (int) config('bigbluebutton.room_name_limit'),
                'welcome_message_limit' => (int) config('bigbluebutton.welcome_message_limit'),
                $this->mergeWhen($this->allSettings, [
                    'style' => setting('bbb_style'),
                    'logo' => setting('bbb_logo'),
                ]),
            ],
            'monitor' => [
                'horizon' => true,
                'pulse' => true,
                'telescope' => config('telescope.enabled'),
            ],
            'banner' => [
                'enabled' => (bool) setting('banner.enabled'),
                $this->mergeWhen(setting('banner.enabled') || $this->allSettings, [
                    'message' => setting('banner.message'),
                    'link' => setting('banner.link'),
                    'icon' => setting('banner.icon'),
                    'color' => setting('banner.color'),
                    'background' => setting('banner.background'),
                    'title' => setting('banner.title'),
                    'link_style' => setting('banner.link_style'),
                    'link_text' => setting('banner.link_text'),
                    'link_target' => setting('banner.link_target'),
                ]),
            ],
            $this->mergeWhen($this->allSettings, [
                'link_btn_styles' => LinkButtonStyle::cases(),
                'link_targets' => LinkTarget::cases(),
                'room_auto_delete' => [
                    'enabled' => (bool) setting('room_auto_delete.enabled'),
                    'inactive_period' => (int) setting('room_auto_delete.inactive_period'),
                    'never_used_period' => (int) setting('room_auto_delete.never_used_period'),
                    'deadline_period' => (int) setting('room_auto_delete.deadline_period'),
                ],
            ]),
            'default_presentation' => $this->when(! empty(setting('default_presentation')), setting('default_presentation')),
            'help_url' => setting('help_url'),
            'legal_notice_url' => setting('legal_notice_url'),
            'privacy_policy_url' => setting('privacy_policy_url'),
            'statistics' => [
                $this->mergeWhen($this->allSettings, [
                    'servers' => [
                        'enabled' => (bool) setting('statistics.servers.enabled'),
                        'retention_period' => (int) setting('statistics.servers.retention_period'),
                    ],
                ]),
                'meetings' => [
                    'enabled' => (bool) setting('statistics.meetings.enabled'),
                    'retention_period' => (int) setting('statistics.meetings.retention_period'),
                ],
            ],
            'recording' => [
                'retention_period' => intval(setting('recording.retention_period')),
                'max_retention_period' => intval(config('recording.max_retention_period')),
                'description_limit' => intval(config('recording.description_limit')),
            ],
            'attendance' => [
                'retention_period' => (int) setting('attendance.retention_period'),
            ],
            'room_token_expiration' => (int) setting('room_token_expiration'),
            'auth' => [
                'local' => config('auth.local.enabled'),
                'ldap' => config('ldap.enabled'),
                'shibboleth' => config('services.shibboleth.enabled'),
            ],
            'room_refresh_rate' => (int) config('bigbluebutton.room_refresh_rate'),
        ];
    }
}
