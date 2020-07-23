<?php

namespace App\Http\Controllers\api\v1\guest;

use App\Http\Controllers\Controller;
use App\Http\Resources\Room;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function show(\App\Room $room, Request $request)
    {
        // User calls room with guest token from email
        if ($request->has('guestToken')) {
        } else {
            // Joining room with code
            if ($request->has('code')) {
            } else {
                return new Room($room);
            }
        }
    }
}
