<?php

namespace App\Http\Requests;

use App\Enums\RoomFilter;
use App\Enums\RoomSortingType;
use App\Enums\RoomUserRole;
use App\Models\User;
use BenSampo\Enum\Rules\EnumValue;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ShowRoomsRequest extends FormRequest
{
    public function rules()
    {
        return[
            'filter'          => ['required', new EnumValue(RoomFilter::class)],
            'room_type'=>['nullable', 'exists:App\Models\RoomType,id'],
            'sort_by' =>['required', new EnumValue(RoomSortingType::class)],
            'search' =>['string'],
            'page'=>['required','integer']
            ];
    }
}
