<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Rules\Antivirus;
use App\Rules\Image;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoomTypeStreamingSettingsRequest extends FormRequest
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
            'default_pause_image' => ['bail', 'nullable', Image::default()->max('5mb'), Rule::dimensions()->width(1920)->height(1080), new Antivirus],
        ];
    }
}
