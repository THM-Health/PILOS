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
     * @param  \Illuminate\Http\Request $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'version'                        => config('app.version'),
            'base_url'                       => config('app.url'),
            'name'                           => setting('name'),
            'logo'                           => setting('logo'),
            'favicon'                        => setting('favicon'),
            'room_limit'                     => intval(setting('room_limit')),
            'pagination_page_size'           => intval(setting('pagination_page_size')),
            'own_rooms_pagination_page_size' => intval(setting('own_rooms_pagination_page_size')),
            'password_self_reset_enabled'    => boolval(setting('password_self_reset_enabled')),
            'default_timezone'               => setting('default_timezone'),
            'bbb'                            => [
                'file_mimes'            => config('bigbluebutton.allowed_file_mimes'),
                'max_filesize'          => intval(config('bigbluebutton.max_filesize')),
                'room_name_limit'       => intval(config('bigbluebutton.room_name_limit')),
                'welcome_message_limit' => intval(config('bigbluebutton.welcome_message_limit')),
                $this->mergeWhen($this->allSettings, [
                    'style' => setting('bbb_style'),
                    'logo'  => setting('bbb_logo'),
                ])
            ],
            'banner' => [
                'enabled'    => boolval(setting('banner.enabled')),
                $this->mergeWhen(boolval(setting('banner.enabled')) || $this->allSettings, [
                    'message'     => setting('banner.message'),
                    'link'        => setting('banner.link'),
                    'icon'        => setting('banner.icon'),
                    'color'       => setting('banner.color'),
                    'background'  => setting('banner.background'),
                    'title'       => setting('banner.title'),
                    'link_style'  => setting('banner.link_style'),
                    'link_text'   => setting('banner.link_text'),
                    'link_target' => setting('banner.link_target'),
                ])
            ],
            $this->mergeWhen($this->allSettings, [
                'link_btn_styles'            => LinkButtonStyle::getValues(),
                'link_targets'               => LinkTarget::getValues(),
                'room_auto_delete'           => [
                    'enabled'              => setting('room_auto_delete.enabled'),
                    'inactive_period'      => setting('room_auto_delete.inactive_period'),
                    'never_used_period'    => setting('room_auto_delete.never_used_period'),
                    'deadline_period'      => setting('room_auto_delete.deadline_period')
                ]
            ]),
            'default_presentation' => $this->when(!empty(setting('default_presentation')), setting('default_presentation')),
            'help_url'             => setting('help_url'),
            'legal_notice_url'     => setting('legal_notice_url'),
            'privacy_policy_url'   => setting('privacy_policy_url'),
            'statistics'           => [
                $this->mergeWhen($this->allSettings, [
                    'servers' => [
                        'enabled'           => boolval(setting('statistics.servers.enabled')),
                        'retention_period'  => intval(setting('statistics.servers.retention_period')),
                    ]
                ]),
                'meetings' => [
                    'enabled'           => boolval(setting('statistics.meetings.enabled')),
                    'retention_period'  => intval(setting('statistics.meetings.retention_period')),
                ],
            ],
            'attendance' => [
                'enabled'           => boolval(setting('attendance.enabled')),
                'retention_period'  => intval(setting('attendance.retention_period')),
            ],
            'room_token_expiration' => intval(setting('room_token_expiration')),
            'auth'                  => [
                'ldap'                   => config('ldap.enabled'),
            ],
            'room_refresh_rate'     => floatval(config('bigbluebutton.room_refresh_rate')),
        ];
    }
}
