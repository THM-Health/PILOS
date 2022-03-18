<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\CustomStatusCodes;
use App\Enums\ServerStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ServerConnectionCheckRequest;
use App\Http\Requests\ServerRequest;
use App\Http\Resources\Server as ServerResource;
use App\Server;
use BigBlueButton\BigBlueButton;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ServerController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Server::class, 'server');
        $this->middleware('check.stale:server,\App\Http\Resources\Server,withApi', ['only' => 'update']);
    }

    /**
     * Return a json array with all room types
     *
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function index(Request $request)
    {
        /**
         * If query param update_usage is true, rebuild live and historical data, the same way as the cronjob would do
         */
        if ($request->has('update_usage') && $request->update_usage == 'true') {
            foreach (Server::all() as $server) {
                $server->updateUsage();
            }
        }

        $resource = Server::query();

        if ($request->has('sort_by') && $request->has('sort_direction')) {
            $by  = $request->query('sort_by');
            $dir = $request->query('sort_direction');

            if (in_array($by, ['id', 'name','participant_count','video_count','meeting_count','status', 'version']) && in_array($dir, ['asc', 'desc'])) {
                $resource = $resource->orderBy($by, $dir);
            }
        }

        if ($request->has('name')) {
            $resource = $resource->withName($request->query('name'));
        }

        $resource = $resource->paginate(setting('pagination_page_size'));

        return ServerResource::collection($resource);
    }

    /**
     * Display the specified resource.
     *
     * @param  Server         $server
     * @return ServerResource
     */
    public function show(Server $server)
    {
        return (new ServerResource($server))->withApi();
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  ServerRequest  $request
     * @param  Server         $server
     * @return ServerResource
     */
    public function update(ServerRequest $request, Server $server)
    {
        $server->name         = $request->name;
        $server->description  = $request->description;
        $server->base_url     = $request->base_url;
        $server->salt         = $request->salt;
        $server->strength     = $request->strength;
        $server->status       = $request->disabled ? ServerStatus::DISABLED : ServerStatus::ONLINE;

        // Check if server is online/offline and update usage data
        $server->updateUsage();

        $server->save();

        return (new ServerResource($server))->withApi();
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  ServerRequest  $request
     * @return ServerResource
     */
    public function store(ServerRequest $request)
    {
        $server               = new Server();
        $server->name         = $request->name;
        $server->description  = $request->description;
        $server->base_url     = $request->base_url;
        $server->salt         = $request->salt;
        $server->strength     = $request->strength;
        $server->status       = $request->disabled ? ServerStatus::DISABLED : ServerStatus::ONLINE;

        // Check if server is online/offline and update usage data
        $server->updateUsage();

        $server->save();

        return (new ServerResource($server))->withApi();
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  Request               $request
     * @param  Server                $server
     * @return JsonResponse|Response
     * @throws \Exception
     */
    public function destroy(Request $request, Server $server)
    {
        /**
         * Server delete fails if not in disabled state or meeting are still marked as running
         */
        if ($server->delete()) {
            return response()->noContent();
        } else {
            return response()->json([
                'error'     => CustomStatusCodes::STALE_MODEL,
                'message'   => __('app.errors.server_delete_failed'),
            ], CustomStatusCodes::STALE_MODEL);
        }
    }

    /**
     * Panic server, change status of the server to disabled and
     * end all meetings running on this server
     *
     * @param Request $request
     * @param Server  $server
     */
    public function panic(Request $request, Server $server)
    {
        $result = $server->panic();

        return \response()->json($result);
    }

    /**
     * Check if this backend can connect to a bbb server with the api credentials in this request
     * @param  ServerConnectionCheckRequest $request
     * @return JsonResponse
     */
    public function check(ServerConnectionCheckRequest $request)
    {
        $connectionOk = false;
        $saltOk       = false;

        try {
            $bbb      = new BigBlueButton($request->base_url, $request->salt);
            $response = $bbb->getMeetings();

            if ($response->success()) {
                $connectionOk = true;
                $saltOk       = true;
            } elseif ($response->hasChecksumError()) {
                $connectionOk = true;
                $saltOk       = false;
            }
        } catch (\Exception $e) {
        }

        return \response()->json(['connection_ok'=>$connectionOk,'salt_ok'=>$saltOk]);
    }
}
