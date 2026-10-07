<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Rules\Antivirus;
use App\Rules\CustomJoinMeetingParameters;
use App\Rules\Image;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class UpdateStreamingSettingsRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'default_pause_image' => ['bail', 'nullable', Image::default()->max('5mb'), Rule::dimensions()->width(1920)->height(1080), new Antivirus],
            'css_file' => ['bail', 'nullable', File::types(['css', 'txt'])->extensions('css')->max('500kb'), new Antivirus],
            'join_parameters' => ['nullable', 'string', 'max:65000', new CustomJoinMeetingParameters],
        ];
    }
}
