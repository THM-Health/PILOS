<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\CustomStatusCodes;
use App\Http\Controllers\Controller;
use App\Http\Requests\ServerPoolRequest;
use App\Http\Resources\ServerPool as ServerPoolResource;
use App\Models\Server;
use App\Models\ServerPool;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ServerPoolController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(ServerPool::class, 'serverPool');
        $this->middleware('check.stale:serverPool,\App\Http\Resources\ServerPool,withServers', ['only' => 'update']);
    }

    /**
     * Return a json array with all room types
     *
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function index(Request $request)
    {
        $additionalMeta = [];
        $resource       = ServerPool::withCount('servers');

        if ($request->has('sort_by') && $request->has('sort_direction')) {
            $by  = $request->query('sort_by');
            $dir = $request->query('sort_direction');

            if (in_array($by, ['id', 'name','servers_count']) && in_array($dir, ['asc', 'desc'])) {
                $resource = $resource->orderBy($by, $dir);
            }
        }

        // count all before search
        $additionalMeta['meta']['total_no_filter'] = $resource->count();

        if ($request->has('name')) {
            $resource = $resource->withName($request->query('name'));
        }

        $resource = $resource->paginate(setting('pagination_page_size'));

        return ServerPoolResource::collection($resource)->additional($additionalMeta);
    }

    /**
     * Display the specified resource.
     *
     * @param  ServerPool         $serverPool
     * @return ServerPoolResource
     */
    public function show(ServerPool $serverPool)
    {
        return (new ServerPoolResource($serverPool))->withServers();
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  ServerPoolRequest  $request
     * @param  Server             $server
     * @return ServerPoolResource
     */
    public function update(ServerPoolRequest $request, ServerPool $serverPool)
    {
        $serverPool->description  = $request->description;
        $serverPool->name         = $request->name;
        $serverPool->save();
        $serverPool->servers()->sync($request->servers);

        return (new ServerPoolResource($serverPool))->withServers();
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  ServerPoolRequest  $request
     * @return ServerPoolResource
     */
    public function store(ServerPoolRequest $request)
    {
        $serverPool               = new ServerPool();
        $serverPool->description  = $request->description;
        $serverPool->name         = $request->name;
        $serverPool->save();
        $serverPool->servers()->sync($request->servers);

        return (new ServerPoolResource($serverPool))->withServers();
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  Request                                $request
     * @param  ServerPool                             $serverPool
     * @return \Illuminate\Http\JsonResponse|Response
     * @throws \Exception
     */
    public function destroy(Request $request, ServerPool $serverPool)
    {
        /**
         * Server delete fails if not in disabled state or meeting are still marked as running
         */
        if ($serverPool->delete()) {
            return response()->noContent();
        } else {
            return response()->json([
                'error'      => CustomStatusCodes::STALE_MODEL,
                'message'    => __('app.errors.server_pool_delete_failed'),
                'room_types' => \App\Http\Resources\RoomType::collection($serverPool->roomTypes)
            ], CustomStatusCodes::STALE_MODEL);
        }
    }
}
