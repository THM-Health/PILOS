<?php

namespace App\Http\Requests;

use App\Rules\Antivirus;
use Illuminate\Foundation\Http\FormRequest;

class StoreRoomFile extends FormRequest
{
    public function rules()
    {
        return [
            'file' => ['bail', 'required', 'file', 'max:'.(config('bigbluebutton.max_filesize') * 1000), 'mimes:'.config('bigbluebutton.allowed_file_mimes'), new Antivirus()], //https://github.com/bigbluebutton/bigbluebutton/blob/v2.2.x-release/bigbluebutton-html5/private/config/settings.yml
        ];
    }
}
