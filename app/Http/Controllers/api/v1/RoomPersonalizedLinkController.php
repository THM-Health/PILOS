<?php

// SPDX-FileCopyrightText: 2021 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Http\Controllers\api\v1;

use App\Enums\RoomUserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\RoomPersonalizedLinkIndexRequest;
use App\Http\Requests\RoomPersonalizedLinkRequest;
use App\Http\Resources\RoomPersonalizedLinkResource;
use App\Models\Room;
use App\Models\RoomPersonalizedLink;
use App\Settings\GeneralSettings;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class RoomPersonalizedLinkController extends Controller
{
    /**
     * Return a list with all personalized links of the room.
     *
     * @param  Room  $room  Room for which the personalized links should be listed.
     * @return AnonymousResourceCollection
     */
    public function index(Room $room, RoomPersonalizedLinkIndexRequest $request)
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
        if ($request->filled('query')) {
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

        Log::info('Created new personalized room link for guest {name} with the role {role} for room {room}', ['room' => $room->getLogLabel(), 'role' => $link->role->label(), 'name' => $link->fullname]);

        return new RoomPersonalizedLinkResource($link);
    }

    /**
     * Update personalized room link.
     *
     * @return RoomPersonalizedLinkResource
     */
    public function update(Room $room, RoomPersonalizedLink $personalizedLink, RoomPersonalizedLinkRequest $request)
    {
        $personalizedLink->firstname = $request->firstname;
        $personalizedLink->lastname = $request->lastname;
        $personalizedLink->role = $request->role;
        $personalizedLink->save();

        Log::info('Updated personalized room link for guest {name} with the role {role} for room {room}', ['room' => $room->getLogLabel(), 'role' => $personalizedLink->role->label(), 'name' => $personalizedLink->fullname]);

        return new RoomPersonalizedLinkResource($personalizedLink);
    }

    /**
     * Remove personalized room link.
     *
     * @return Response
     *
     * @throws \Exception
     */
    public function destroy(Room $room, RoomPersonalizedLink $personalizedLink)
    {
        $personalizedLink->delete();

        Log::info('Removed personalized room link for guest {name} with the role {role} for room {room}', ['room' => $room->getLogLabel(), 'role' => $personalizedLink->role->label(), 'name' => $personalizedLink->fullname]);

        return response()->noContent();
    }
}
