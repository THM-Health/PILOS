<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ApplicationSettings extends JsonResource
{
    public function __construct()
    {
        parent::__construct(null);
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
            ]
        ];
    }
}
