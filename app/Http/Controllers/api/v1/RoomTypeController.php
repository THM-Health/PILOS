<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\RoomType;
use App\Http\Resources\RoomType as RoomTypeResource;

class RoomTypeController extends Controller
{
    public function __construct()
    {
        //$this->authorizeResource(RoomType::class, 'roomType');
    }

    /**
     * Return a json array with all rooms the user owners or is member of
     *
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function index()
    {
        return RoomTypeResource::collection(RoomType::all());
    }
}
