<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RoomTypeDestroyRequest;
use App\Http\Requests\RoomTypeRequest;
use App\RoomType;
use App\Http\Resources\RoomType as RoomTypeResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class RoomTypeController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(RoomType::class, 'roomType');
        $this->middleware('check.stale:roomType,\App\Http\Resources\RoomType,withServerPool', ['only' => 'update']);
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
        return (new RoomTypeResource($roomType))->withServerPool()->withRoles();
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
        $roomType->description   = $request->description;
        $roomType->short         = $request->short;
        $roomType->color         = $request->color;
        $roomType->allow_listing = $request->allow_listing;
        $roomType->restrict      = $request->restrict;
        $roomType->serverPool()->associate($request->server_pool);
        if ($roomType->restrict) {
            $roomType->roles()->sync($request->roles);
        }
        $roomType->save();

        return (new RoomTypeResource($roomType))->withServerPool()->withRoles();
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  RoomTypeRequest  $request
     * @return RoomTypeResource
     */
    public function store(RoomTypeRequest $request)
    {
        $roomType                = new RoomType();
        $roomType->description   = $request->description;
        $roomType->short         = $request->short;
        $roomType->color         = $request->color;
        $roomType->allow_listing = $request->allow_listing;
        $roomType->restrict      = $request->restrict;
        $roomType->serverPool()->associate($request->server_pool);
        if ($roomType->restrict) {
            $roomType->roles()->associate($request->roles);
        }
        $roomType->save();

        return (new RoomTypeResource($roomType))->withServerPool()->withRoles();
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  RoomTypeDestroyRequest $request
     * @param  RoomType               $roomType
     * @return JsonResponse|Response
     * @throws \Exception
     */
    public function destroy(RoomTypeDestroyRequest $request, RoomType $roomType)
    {
        $roomType->loadCount('rooms');

        if ($request->has('replacement_room_type')) {
            // Replace room type
            foreach ($roomType->rooms as $room) {
                $room->roomType()->associate($request->replacement_room_type);
                $room->save();
            }
        }

        $roomType->delete();

        return response()->noContent();
    }
}
