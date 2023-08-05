<?php

namespace App\Http\Requests;

use App\Enums\RoomFilter;
use App\Enums\RoomSortingType;
use BenSampo\Enum\Rules\EnumValue;
use Illuminate\Foundation\Http\FormRequest;

class ShowRoomsRequest extends FormRequest
{
    public function rules()
    {
        return[
            'filter_own'      => ['required', 'boolean'],
            'filter_shared'   => ['required', 'boolean'],
            'filter_public'   => ['required', 'boolean'],
            'filter_all'      => ['required', 'boolean'],
            'room_type'       => ['nullable', 'exists:App\Models\RoomType,id'],
            'sort_by'         => ['required', new EnumValue(RoomSortingType::class)],
            'search'          => ['string'],
            'page'            => ['required','integer']
            ];
    }
}
