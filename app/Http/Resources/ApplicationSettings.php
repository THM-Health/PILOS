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
            'name'                           => setting('name'),
            'logo'                           => setting('logo'),
            'favicon'                        => setting('favicon'),
            'room_limit'                     => intval(setting('room_limit')),
            'pagination_page_size'           => intval(setting('pagination_page_size')),
            'own_rooms_pagination_page_size' => intval(setting('own_rooms_pagination_page_size')),
            'bbb'                            => [
                'file_mimes'            => config('bigbluebutton.allowed_file_mimes'),
                'max_filesize'          => intval(config('bigbluebutton.max_filesize')),
                'room_name_limit'       => intval(config('bigbluebutton.room_name_limit')),
                'welcome_message_limit' => intval(config('bigbluebutton.welcome_message_limit'))
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
                'link_btn_styles' => LinkButtonStyle::getValues(),
                'link_targets'    => LinkTarget::getValues()
            ])
        ];
    }
}
