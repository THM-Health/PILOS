<?php

declare(strict_types=1);

namespace App\Http\Controllers\external\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\External\CreateRoomRequest;
use App\Http\Resources\External\RoomResource;
use App\Models\Room;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;

class RoomController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Room::class, 'room');
    }

    public function index(): AnonymousResourceCollection
    {
        $rooms = Room::query()
            ->where('user_id', Auth::id())
            ->with('roomType')
            ->orderByRaw('LOWER(name)')
            ->orderBy('id')
            ->get();

        return RoomResource::collection($rooms);
    }

    public function store(CreateRoomRequest $request): RoomResource
    {
        if (Auth::user()->hasRoomLimitExceeded()) {
            abort(429, __('app.errors.room_limit_exceeded'));
        }

        $room = new Room;
        $room->name = $request->validated('name');
        $room->access_code = $request->validated('access_code');
        $room->allow_guests = (bool) $request->validated('allow_guests');
        $room->roomType()->associate($request->validated('room_type'));
        $room->owner()->associate(Auth::user());
        $room->save();

        $room->save();

        return new RoomResource($room);
    }
}
