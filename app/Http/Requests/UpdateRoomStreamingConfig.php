<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomStreamingConfig extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'enabled' => ['required', 'boolean'],
            'url' => ['nullable', 'required_if_accepted:enabled', 'string', 'url:rtmp,rtmps', 'max:255'],
            'pause_image' => ['nullable', 'image', 'mimes:jpg,bmp,png,gif', 'max:5000', 'dimensions:width=1920,height=1080'], // 5 MB
        ];
    }

    public function attributes()
    {
        return [
            'url' => __('validation.attributes.streaming_url'),
            'pause_image' => __('validation.attributes.streaming_pause_image'),
        ];
    }

    public function messages()
    {
        return [
            'pause_image.dimensions' => __('validation.custom.streaming_pause_image_file.dimensions'),
            'url.url' => __('validation.custom.streaming_url.url'),
            'url.required_if_accepted' => __('validation.custom.streaming_url.required_if_accepted'),

        ];
    }
}
