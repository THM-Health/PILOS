<?php

namespace App\Http\Requests;

use App\Enums\RoomSortingType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ShowRoomsRequest extends FormRequest
{
    public function rules()
    {
        return [
            'filter_own' => ['required', 'boolean'],
            'filter_shared' => ['required', 'boolean'],
            'filter_public' => ['required', 'boolean'],
            'filter_all' => ['required', 'boolean'],
            'only_favorites' => ['required', 'boolean'],
            'room_type' => ['nullable', 'integer', 'exists:App\Models\RoomType,id'],
            'sort_by' => ['required', Rule::enum(RoomSortingType::class)],
            'search' => ['string'],
            'page' => ['required', 'integer'],
            'per_page' => ['required', 'integer', 'max:20'],
        ];
    }
}
