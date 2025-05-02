<?php

namespace App\Http\Requests;

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
            'default_pause_image' => ['nullable', 'image', 'mimes:jpg,bmp,png,gif', 'max:5000', 'dimensions:width=1920,height=1080'], // 5 MB
            'css_file' => ['nullable', 'file', 'max:500', 'extensions:css'],
            'join_parameters' => ['nullable', 'string', 'max:65000', new CustomJoinMeetingParameters],
        ];
    }
}
