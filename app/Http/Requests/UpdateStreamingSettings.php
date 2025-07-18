<?php

namespace App\Http\Requests;

use App\Rules\Antivirus;
use App\Rules\CustomJoinMeetingParameters;
use Illuminate\Foundation\Http\FormRequest;

class UpdateStreamingSettings extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'default_pause_image' => ['bail', 'nullable', 'image', 'mimes:jpg,bmp,png,gif', 'max:5000', 'dimensions:width=1920,height=1080', new Antivirus], // 5 MB
            'css_file' => ['bail', 'nullable', 'file', 'max:500', 'extensions:css', new Antivirus],
            'join_parameters' => ['nullable', 'string', 'max:65000', new CustomJoinMeetingParameters],
        ];
    }
}
