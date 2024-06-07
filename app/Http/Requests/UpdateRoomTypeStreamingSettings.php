<?php

namespace App\Http\Requests;

use App\Rules\Antivirus;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomTypeStreamingSettings extends FormRequest
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
            'default_pause_image' => ['bail', 'nullable', 'image', 'mimes:jpg,bmp,png,gif', 'max:5000', 'dimensions:width=1920,height=1080', new Antivirus], // 5 MB
        ];
    }
}
