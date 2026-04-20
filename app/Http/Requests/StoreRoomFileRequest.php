<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Rules\Antivirus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class StoreRoomFileRequest extends FormRequest
{
    public function rules()
    {
        return [
            'file' => ['bail', 'required', File::types(config('bigbluebutton.allowed_file_mimes'))->extensions(config('bigbluebutton.allowed_file_mimes'))->max(config('bigbluebutton.max_filesize').'mb'), new Antivirus], // https://github.com/bigbluebutton/bigbluebutton/blob/v2.2.x-release/bigbluebutton-html5/private/config/settings.yml
        ];
    }
}
