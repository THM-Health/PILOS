<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\RoomUserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\RoomPersonalizedLinkRequest;
use App\Http\Resources\RoomPersonalizedLink as RoomPersonalizedLinkResource;
use App\Models\Room;
use App\Models\RoomPersonalizedLink;
use App\Settings\GeneralSettings;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Log;

class RoomPersonalizedLinkController extends Controller
{
    /**
     * Return a list with all personalized links of the room.
     *
     * @param  Room  $room  Room for which the personalized links should be listed.
     * @return AnonymousResourceCollection
     */
    public function index(Room $room, Request $request)
    {
        $additional = [];

        // Sort by column, fallback/default is firstname
        $sortBy = match ($request->query('sort_by')) {
            'lastname' => 'LOWER(lastname)',
            'last_usage' => 'last_usage',
            default => 'LOWER(firstname)',
        };

        // Sort direction, fallback/default is asc
        $sortOrder = match ($request->query('sort_direction')) {
            'desc' => 'DESC',
            default => 'ASC',
        };

        // Filter by role, fallback/default is no filter
        $filter = match ($request->query('filter')) {
            'participant_role' => ['role', RoomUserRole::USER],
            'moderator_role' => ['role', RoomUserRole::MODERATOR],
            default => null,
        };

        $sortQuery = $sortBy.' '.$sortOrder;
        // Fix last_usage column null values
        if ($sortBy === 'last_usage') {
            $sortQuery = 'last_usage IS NOT NULL '.$sortOrder.', '.$sortQuery;
        }

        // Get all links of the room and sort them
        $resource = $room->personalizedLinks()->orderByRaw($sortQuery)->orderBy('room_personalized_links.id');

        // count all before applying filters
        $additional['meta']['total_no_filter'] = $resource->count();

        // Apply search query if set
        if ($request->has('query')) {
            // Split search query into single words and search for them in firstname and lastname
            $searchQueries = explode(' ', preg_replace('/\s\s+/', ' ', $request->query('query')));
            foreach ($searchQueries as $searchQuery) {
                $resource = $resource->where(function ($query) use ($searchQuery) {
                    $query->whereLike('firstname', '%'.$searchQuery.'%')
                        ->orWhereLike('lastname', '%'.$searchQuery.'%');
                });
            }
        }

        // Apply filter if set, first element is the column, second the value to query
        if ($filter) {
            $resource = $resource->where($filter[0], $filter[1]);
        }

        return RoomPersonalizedLinkResource::collection($resource->paginate(app(GeneralSettings::class)->pagination_page_size))->additional($additional);
    }

    /**
     * Add a new personalized room link.
     *
     * @return RoomPersonalizedLinkResource
     */
    public function store(Room $room, RoomPersonalizedLinkRequest $request)
    {
        $link = new RoomPersonalizedLink;
        $link->firstname = $request->firstname;
        $link->lastname = $request->lastname;
        $link->role = $request->role;
        $room->personalizedLinks()->save($link);

        Log::info('Created new personalized room link for guest {name} with the role {role} for room {room}', ['room' => $room->getLogLabel(), 'role' => $link->role->label(), 'name' => $link->firstname.' '.$link->lastname]);

        return new RoomPersonalizedLinkResource($link);
    }

    /**
     * Update personalized room link.
     *
     * @return RoomPersonalizedLinkResource
     */
    public function update(Room $room, RoomPersonalizedLink $link, RoomPersonalizedLinkRequest $request)
    {
        if (! $link->room->is($room)) {
            abort(404, __('app.errors.personalized_link_not_found'));
        }

        $link->firstname = $request->firstname;
        $link->lastname = $request->lastname;
        $link->role = $request->role;
        $link->save();

        Log::info('Updated personalized room link for guest {name} with the role {role} for room {room}', ['room' => $room->getLogLabel(), 'role' => $link->role->label(), 'name' => $link->firstname.' '.$link->lastname]);

        return new RoomPersonalizedLinkResource($link);
    }

    /**
     * Remove personalized room link.
     *
     * @return Response
     *
     * @throws \Exception
     */
    public function destroy(Room $room, RoomPersonalizedLink $link)
    {
        if (! $link->room->is($room)) {
            abort(404, __('app.errors.personalized_link_not_found'));
        }

        $link->delete();

        Log::info('Removed personalized room link for guest {name} with the role {role} for room {room}', ['room' => $room->getLogLabel(), 'role' => $link->role->label(), 'name' => $link->firstname.' '.$link->lastname]);

        return response()->noContent();
    }
}
