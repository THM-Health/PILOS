<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class UpdateSetting extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name'                           => 'required|string|max:255',
            'room_limit'                     => 'required|numeric|min:-1|max:100',
            'logo'                           => 'required_without:logo_file|string|max:255',
            'logo_file'                      => 'required_without:logo|image|max:500', // 500 KB, larger files are bad for loading times
            'favicon'                        => 'required_without:favicon_file|string|max:255',
            'favicon_file'                   => 'required_without:favicon|mimes:ico|max:500', // 500 KB, larger files are bad for loading times
            'own_rooms_pagination_page_size' => 'required|numeric|min:1|max:25',
            'pagination_page_size'           => 'required|numeric|min:1|max:100',
            'banner'                         => 'required|array',
            'banner.enabled'                 => 'required|boolean',
            'banner.title'                   => 'nullable|string|max:255',
            'banner.message'                 => [Rule::requiredIf(is_array($this->banner) && boolval($this->banner['enabled'])), 'string', 'max:500'],
            'banner.link'                    => 'nullable|string|url|max:255',
            'banner.icon'                    => 'nullable|string|max:255|regex:/^fa\\-([a-z0-9]+(?(?=\\-)\\-[a-z0-9]+)*)$/',
            'banner.color'                   => [Rule::requiredIf(is_array($this->banner) && boolval($this->banner['enabled'])), 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'banner.background'              => [Rule::requiredIf(is_array($this->banner) && boolval($this->banner['enabled'])), 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/']
        ];
    }
}
