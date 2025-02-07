<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomStreamingSettings extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'streaming_enabled' => ['required', 'boolean'],
            'streaming_url' => ['nullable', 'required_if_accepted:streaming_enabled', 'string', 'url:rtmp,rtmps', 'max:255'],
            'streaming_pause_image' => ['nullable', 'image', 'max:5000', 'dimensions:width=1920,height=1080'], // 5 MB
        ];
    }
}
