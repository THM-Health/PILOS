<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RoomTypeRequest;
use App\RoomType;
use App\Http\Resources\RoomType as RoomTypeResource;

class RoomTypeController extends Controller
{
    public function __construct()
    {
        //$this->authorizeResource(RoomType::class, 'roomType');
    }

    /**
     * Return a json array with all room types
     *
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function index()
    {
        return RoomTypeResource::collection(RoomType::all());
    }

    /**
     * Display the specified resource.
     *
     * @param  RoomType         $roomType
     * @return RoomTypeResource
     */
    public function show(RoomType $roomType)
    {
        return new RoomTypeResource($roomType);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  RoomTypeRequest  $request
     * @param  RoomType         $roomType
     * @return RoomTypeResource
     */
    public function update(RoomTypeRequest $request, RoomType $roomType)
    {
        $roomType->description = $request->description;
        $roomType->short       = $request->short;
        $roomType->color       = $request->color;
        $roomType->save();

        return new RoomTypeResource($roomType);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  RoomTypeRequest  $request
     * @return RoomTypeResource
     */
    public function store(RoomTypeRequest $request)
    {
        $roomType              = new RoomType();
        $roomType->description = $request->description;
        $roomType->short       = $request->short;
        $roomType->color       = $request->color;
        $roomType->save();

        return new RoomTypeResource($roomType);
    }
}
