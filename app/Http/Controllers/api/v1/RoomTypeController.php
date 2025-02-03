<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RoomTypeDestroyRequest;
use App\Http\Requests\RoomTypeRequest;
use App\Http\Resources\RoomType as RoomTypeResource;
use App\Http\Resources\RoomTypeResourceCollection;
use App\Models\Room;
use App\Models\RoomType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class RoomTypeController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(RoomType::class, 'roomType');
        $this->middleware('check.stale:roomType,\App\Http\Resources\RoomType,withDetails,withDefaultRoomSettings', ['only' => 'update']);
    }

    /**
     * Return a json array with all room types
     *
     * @return RoomTypeResourceCollection
     */
    public function index(Request $request)
    {
        $roomTypes = RoomType::query();

        if ($request->has('filter')) {
            $filter = $request->query('filter');

            if ($filter === 'own') {
                // Get list of the room type the current user has access to (Used when creating a new room)
                $roomTypes = $roomTypes->where('restrict', '=', false)
                    ->orWhereIn('id', function ($query) {
                        $query->select('role_room_type.room_type_id')
                            ->from('role_room_type as role_room_type')
                            ->whereIn('role_room_type.role_id', Auth::user()->roles->pluck('id')->all());
                    });
            } else {
                // Get list of room types the owner of the given room has access to (Used when changing room type)
                $room = Room::find($filter);

                if (is_null($room) || Auth::user()->cannot('viewSettings', $room)) {
                    abort(403, __('app.errors.no_room_access'));
                }

                $roomTypes = $roomTypes->where('restrict', '=', false)
                    ->orWhereIn('id', function ($query) use ($room) {
                        $query->select('role_room_type.room_type_id')
                            ->from('role_room_type as role_room_type')
                            ->whereIn('role_room_type.role_id', $room->owner->roles->pluck('id')->all());
                    });
            }
        }

        $roomTypes = $roomTypes->orderByRaw('LOWER(name)')->orderBy('room_types.id');

        if ($request->boolean('with_room_settings')) {
            return (new RoomTypeResourceCollection($roomTypes->get()))->withDefaultRoomSettings();
        } else {
            return new RoomTypeResourceCollection($roomTypes->get());
        }

    }

    /**
     * Display the specified resource.
     *
     * @return RoomTypeResource
     */
    public function show(RoomType $roomType)
    {

        return (new RoomTypeResource($roomType))->withDetails()->withDefaultRoomSettings();
    }

    /**
     * Update the specified resource in storage.
     *
     * @return RoomTypeResource
     */
    public function update(RoomTypeRequest $request, RoomType $roomType)
    {
        $roomType->name = $request->name;
        $roomType->description = $request->description;
        $roomType->color = $request->color;
        $roomType->restrict = $request->restrict;
        $roomType->max_participants = $request->max_participants;
        $roomType->max_duration = $request->max_duration;
        $roomType->create_parameters = $request->create_parameters;
        $roomType->serverPool()->associate($request->server_pool);

        // Save default room settings
        foreach (Room::ROOM_SETTINGS_DEFINITION as $setting => $config) {
            $roomType[$setting.'_default'] = $request[$setting.'_default'];
            $roomType[$setting.'_enforced'] = $request[$setting.'_enforced'];
        }

        $roomType->has_access_code_default = $request->has_access_code_default;
        $roomType->has_access_code_enforced = $request->has_access_code_enforced;

        $roomType->save();

        if ($roomType->restrict) {
            $roomType->roles()->sync($request->roles);
        }

        return (new RoomTypeResource($roomType))->withDetails()->withDefaultRoomSettings();
    }

    /**
     * Store a newly created resource in storage.
     *
     * @return RoomTypeResource
     */
    public function store(RoomTypeRequest $request)
    {
        $roomType = new RoomType;
        $roomType->name = $request->name;
        $roomType->description = $request->description;
        $roomType->color = $request->color;
        $roomType->restrict = $request->restrict;
        $roomType->max_participants = $request->max_participants;
        $roomType->max_duration = $request->max_duration;
        $roomType->create_parameters = $request->create_parameters;
        $roomType->serverPool()->associate($request->server_pool);

        // Safe default room settings
        foreach (Room::ROOM_SETTINGS_DEFINITION as $setting => $config) {
            $roomType[$setting.'_default'] = $request[$setting.'_default'];
            $roomType[$setting.'_enforced'] = $request[$setting.'_enforced'];
        }

        $roomType->has_access_code_default = $request->has_access_code_default;
        $roomType->has_access_code_enforced = $request->has_access_code_enforced;

        $roomType->save();

        if ($roomType->restrict) {
            $roomType->roles()->sync($request->roles);
        }

        return (new RoomTypeResource($roomType))->withDetails()->withDefaultRoomSettings();
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return JsonResponse|Response
     *
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
