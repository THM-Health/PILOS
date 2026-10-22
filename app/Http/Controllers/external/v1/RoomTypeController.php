<?php

declare(strict_types=1);

namespace App\Http\Controllers\external\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\External\RoomTypeIndexRequest;
use App\Http\Resources\External\RoomTypeResource;
use App\Models\RoomType;
use Illuminate\Support\Facades\Auth;

class RoomTypeController extends Controller
{
    public function index(RoomTypeIndexRequest $request)
    {
        $roomTypes = RoomType::query();

        if ($request->query('filter') === 'own') {
            // Get list of the room type the current user has access to (Used when creating a new room)
            $roomTypes = $roomTypes->where('restrict', '=', false)
                ->orWhereIn('id', function ($query) {
                    $query->select('role_room_type.room_type_id')
                        ->from('role_room_type as role_room_type')
                        ->whereIn('role_room_type.role_id', Auth::user()->roles->pluck('id')->all());
                });
        }

        return RoomTypeResource::collection($roomTypes->get());
    }
}
