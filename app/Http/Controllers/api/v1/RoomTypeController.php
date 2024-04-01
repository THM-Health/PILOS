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
        $this->middleware('check.stale:roomType,\App\Http\Resources\RoomType,withServerPool,withRoles', ['only' => 'update']);
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
            $filter = $request->get('filter');

            if ($filter === 'own') {
                $roomTypes = $roomTypes->where('restrict', '=', false)
                    ->orWhereIn('id', function ($query) {
                        $query->select('role_room_type.room_type_id')
                            ->from('role_room_type as role_room_type')
                            ->whereIn('role_room_type.role_id', Auth::user()->roles->pluck('id')->all());
                    });
            } elseif ($filter === 'searchable') {
                $roomTypes = $roomTypes->where('allow_listing', '=', true);
            } else {
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
        //Todo check and think about creating Request (ShowRoomTypesRequest??)
        if($request->boolean('with_room_settings')){
            return (new RoomTypeResourceCollection($roomTypes->orderBy('name')->get()))->withDefaultRoomSettings();
        }
        else{
            return new RoomTypeResourceCollection($roomTypes->orderBy('name')->get());
        }

    }

    /**
     * Display the specified resource.
     *
     * @return RoomTypeResource
     */
    public function show(RoomType $roomType)
    {

        return (new RoomTypeResource($roomType))->withServerPool()->withRoles()->withDefaultRoomSettings();
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
        $roomType->allow_listing = $request->allow_listing;
        $roomType->restrict = $request->restrict;
        $roomType->max_participants = $request->max_participants;
        $roomType->max_duration = $request->max_duration;
        $roomType->require_access_code = $request->require_access_code;
        $roomType->allow_record_attendance = $request->allow_record_attendance;
        $roomType->serverPool()->associate($request->server_pool);

        $roomType->webcams_only_for_moderator_default = $request->webcams_only_for_moderator_default;
        $roomType->webcams_only_for_moderator_enforced = $request->webcams_only_for_moderator_enforced;
        $roomType->mute_on_start_default = $request->mute_on_start_default;
        $roomType->mute_on_start_enforced = $request->mute_on_start_enforced;
        $roomType->lock_settings_disable_cam_default = $request->lock_settings_disable_cam_default;
        $roomType->lock_settings_disable_cam_enforced = $request->lock_settings_disable_cam_enforced;
        $roomType->lock_settings_disable_mic_default = $request->lock_settings_disable_mic_default;
        $roomType->lock_settings_disable_mic_enforced = $request->lock_settings_disable_mic_enforced;
        $roomType->lock_settings_disable_private_chat_default = $request->lock_settings_disable_private_chat_default;
        $roomType->lock_settings_disable_private_chat_enforced = $request->lock_settings_disable_private_chat_enforced;
        $roomType->lock_settings_disable_public_chat_default = $request->lock_settings_disable_public_chat_default;
        $roomType->lock_settings_disable_public_chat_enforced = $request->lock_settings_disable_public_chat_enforced;
        $roomType->lock_settings_disable_note_default = $request->lock_settings_disable_note_default;
        $roomType->lock_settings_disable_note_enforced = $request->lock_settings_disable_note_enforced;
        $roomType->lock_settings_hide_user_list_default = $request->lock_settings_hide_user_list_default;
        $roomType->lock_settings_hide_user_list_enforced = $request->lock_settings_hide_user_list_enforced;
        $roomType->everyone_can_start_default = $request->everyone_can_start_default;
        $roomType->everyone_can_start_enforced = $request->everyone_can_start_enforced;
        $roomType->allow_guests_default = $request->allow_guests_default;
        $roomType->allow_guests_enforced = $request->allow_guests_enforced;
        $roomType->allow_membership_default = $request->allow_membership_default;
        $roomType->allow_membership_enforced = $request->allow_membership_enforced;
        $roomType->default_role_default = $request->default_role_default;
        $roomType->default_role_enforced = $request->default_role_enforced;
        $roomType->lobby_default = $request->lobby_default;
        $roomType->lobby_enforced = $request->lobby_enforced;

        $roomType->save();
        if ($roomType->restrict) {
            $roomType->roles()->sync($request->roles);
        }

        return (new RoomTypeResource($roomType))->withServerPool()->withRoles()->withDefaultRoomSettings();
    }

    /**
     * Store a newly created resource in storage.
     *
     * @return RoomTypeResource
     */
    public function store(RoomTypeRequest $request)
    {
        $roomType = new RoomType();
        $roomType->name = $request->name;
        $roomType->description = $request->description;
        $roomType->color = $request->color;
        $roomType->allow_listing = $request->allow_listing;
        $roomType->restrict = $request->restrict;
        $roomType->max_participants = $request->max_participants;
        $roomType->max_duration = $request->max_duration;
        $roomType->require_access_code = $request->require_access_code;
        $roomType->allow_record_attendance = $request->allow_record_attendance;
        $roomType->serverPool()->associate($request->server_pool);

        $roomType->webcams_only_for_moderator_default = $request->webcams_only_for_moderator_default;
        $roomType->webcams_only_for_moderator_enforced = $request->webcams_only_for_moderator_enforced;
        $roomType->mute_on_start_default = $request->mute_on_start_default;
        $roomType->mute_on_start_enforced = $request->mute_on_start_enforced;
        $roomType->lock_settings_disable_cam_default = $request->lock_settings_disable_cam_default;
        $roomType->lock_settings_disable_cam_enforced = $request->lock_settings_disable_cam_enforced;
        $roomType->lock_settings_disable_mic_default = $request->lock_settings_disable_mic_default;
        $roomType->lock_settings_disable_mic_enforced = $request->lock_settings_disable_mic_enforced;
        $roomType->lock_settings_disable_private_chat_default = $request->lock_settings_disable_private_chat_default;
        $roomType->lock_settings_disable_private_chat_enforced = $request->lock_settings_disable_private_chat_enforced;
        $roomType->lock_settings_disable_public_chat_default = $request->lock_settings_disable_public_chat_default;
        $roomType->lock_settings_disable_public_chat_enforced = $request->lock_settings_disable_public_chat_enforced;
        $roomType->lock_settings_disable_note_default = $request->lock_settings_disable_note_default;
        $roomType->lock_settings_disable_note_enforced = $request->lock_settings_disable_note_enforced;
        $roomType->lock_settings_hide_user_list_default = $request->lock_settings_hide_user_list_default;
        $roomType->lock_settings_hide_user_list_enforced = $request->lock_settings_hide_user_list_enforced;
        $roomType->everyone_can_start_default = $request->everyone_can_start_default;
        $roomType->everyone_can_start_enforced = $request->everyone_can_start_enforced;
        $roomType->allow_guests_default = $request->allow_guests_default;
        $roomType->allow_guests_enforced = $request->allow_guests_enforced;
        $roomType->allow_membership_default = $request->allow_membership_default;
        $roomType->allow_membership_enforced = $request->allow_membership_enforced;
        $roomType->default_role_default = $request->default_role_default;
        $roomType->default_role_enforced = $request->default_role_enforced;
        $roomType->lobby_default = $request->lobby_default;
        $roomType->lobby_enforced = $request->lobby_enforced;

        $roomType->save();
        if ($roomType->restrict) {
            $roomType->roles()->sync($request->roles);
        }

        return (new RoomTypeResource($roomType))->withServerPool()->withRoles()->withDefaultRoomSettings();
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
