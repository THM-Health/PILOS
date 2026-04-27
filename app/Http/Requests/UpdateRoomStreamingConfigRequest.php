<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Rules\Antivirus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class UpdateRoomStreamingConfigRequest extends FormRequest
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
            'pause_image' => ['bail', 'nullable', File::types(['jpg', 'bmp', 'png', 'gif'])->extensions(['jpg', 'jpeg', 'bmp', 'png', 'gif'])->max('5mb'), Rule::dimensions()->width(1920)->height(1080), new Antivirus],
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
