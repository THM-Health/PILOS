<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\RoomUserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\RoomTokenRequest;
use App\Http\Resources\RoomToken as RoomTokenResource;
use App\Models\Room;
use App\Models\RoomToken;
use App\Settings\GeneralSettings;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Log;

class RoomTokenController extends Controller
{
    /**
     * Return a list with all personalized tokens of the room.
     *
     * @param  Room  $room  Room for which the tokens should be listed.
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

        // Get all tokens of the room and sort them
        $resource = $room->tokens()->orderByRaw($sortQuery)->orderBy('room_tokens.token');

        // count all before applying filters
        $additional['meta']['total_no_filter'] = $resource->count();

        // Apply search query if set
        if ($request->has('search')) {
            // Split search query into single words and search for them in firstname and lastname
            $searchQueries = explode(' ', preg_replace('/\s\s+/', ' ', $request->search));
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

        return RoomTokenResource::collection($resource->paginate(app(GeneralSettings::class)->pagination_page_size))->additional($additional);
    }

    /**
     * Add a new personalized room token.
     *
     * @return RoomTokenResource
     */
    public function store(Room $room, RoomTokenRequest $request)
    {
        $token = new RoomToken;
        $token->firstname = $request->firstname;
        $token->lastname = $request->lastname;
        $token->role = $request->role;
        $room->tokens()->save($token);

        Log::info('Created new room token for guest {name} with the role {role} for room {room}', ['room' => $room->getLogLabel(), 'role' => $token->role->label(), 'name' => $token->firstname.' '.$token->lastname]);

        return new RoomTokenResource($token);
    }

    /**
     * Update personalized room token.
     *
     * @return RoomTokenResource
     */
    public function update(Room $room, RoomToken $token, RoomTokenRequest $request)
    {
        if (! $token->room->is($room)) {
            abort(404, __('app.errors.token_not_found'));
        }

        $token->firstname = $request->firstname;
        $token->lastname = $request->lastname;
        $token->role = $request->role;
        $token->save();

        Log::info('Updated room token for guest {name} with the role {role} for room {room}', ['room' => $room->getLogLabel(), 'role' => $token->role->label(), 'name' => $token->firstname.' '.$token->lastname]);

        return new RoomTokenResource($token);
    }

    /**
     * Remove personalized room token.
     *
     * @return Response
     *
     * @throws \Exception
     */
    public function destroy(Room $room, RoomToken $token)
    {
        if (! $token->room->is($room)) {
            abort(404, __('app.errors.token_not_found'));
        }

        $token->delete();

        Log::info('Removed room token for guest {name} with the role {role} for room {room}', ['room' => $room->getLogLabel(), 'role' => $token->role->label(), 'name' => $token->firstname.' '.$token->lastname]);

        return response()->noContent();
    }
}
