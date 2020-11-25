<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
            'room_limit'                     => 'required|numeric|min:-1,max:255',
            'logo'                           => 'required_without:logo_file|string|max:255',
            'logo_file'                      => 'required_without:logo|image|max:500', // 500 KB, larger files are bad for loading times
            'own_rooms_pagination_page_size' => 'required|numeric|min:1,max:255',
            'pagination_page_size'           => 'required|numeric|min:1,max:255'
        ];
    }
}
