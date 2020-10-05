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
            'room_limit'                     => 'sometimes|required|numeric|max:255',
            'logo'                           => 'sometimes|required|url|max:255',
            'own_rooms_pagination_page_size' => 'sometimes|required|numeric|max:255',
            'pagination_page_size'           => 'sometimes|required|numeric|max:255'
        ];
    }
}
