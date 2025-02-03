<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\CustomStatusCodes;
use App\Http\Controllers\Controller;
use App\Http\Requests\ServerConnectionCheckRequest;
use App\Http\Requests\ServerRequest;
use App\Http\Resources\Server as ServerResource;
use App\Models\Server;
use App\Services\BigBlueButton\LaravelHTTPClient;
use App\Services\ServerService;
use App\Settings\GeneralSettings;
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
                $serverService = new ServerService($server);
                $serverService->updateUsage();
            }
        }

        $additionalMeta = [];
        $resource = Server::query();

        // Sort by column, fallback/default is id
        $sortBy = match ($request->query('sort_by')) {
            'participant_count' => 'participant_count',
            'video_count' => 'video_count',
            'meeting_count' => 'meeting_count',
            'status' => 'status',
            'version' => 'version',
            'name' => 'LOWER(name)',
            default => 'id',
        };

        // Sort direction, fallback/default is asc
        $sortOrder = match ($request->query('sort_direction')) {
            'desc' => 'DESC',
            default => 'ASC',
        };
        $resource = $resource->orderByRaw($sortBy.' '.$sortOrder);

        // Add secondary sort by id to ensure consistent ordering
        if ($sortBy != 'id') {
            $resource = $resource->orderBy('id');
        }

        // count all before search
        $additionalMeta['meta']['total_no_filter'] = $resource->count();

        if ($request->has('name')) {
            $resource = $resource->withName($request->query('name'));
        }

        $resource = $resource->paginate(app(GeneralSettings::class)->pagination_page_size);

        return ServerResource::collection($resource)->additional($additionalMeta);
    }

    /**
     * Display the specified resource.
     *
     * @return ServerResource
     */
    public function show(Server $server)
    {
        return (new ServerResource($server))->withApi();
    }

    /**
     * Update the specified resource in storage.
     *
     * @return ServerResource
     */
    public function update(ServerRequest $request, Server $server)
    {
        $server->name = $request->name;
        $server->description = $request->description;
        $server->base_url = $request->base_url;
        $server->secret = $request->secret;
        $server->strength = $request->strength;
        $server->status = $request->status;

        $server->error_count = 0;
        $server->recover_count = config('bigbluebutton.server_online_threshold');

        // Check if server is online/offline and update usage data
        $serverService = new ServerService($server);
        $serverService->updateUsage();

        $server->save();

        return (new ServerResource($server))->withApi();
    }

    /**
     * Store a newly created resource in storage.
     *
     * @return ServerResource
     */
    public function store(ServerRequest $request)
    {
        $server = new Server;
        $server->name = $request->name;
        $server->description = $request->description;
        $server->base_url = $request->base_url;
        $server->secret = $request->secret;
        $server->strength = $request->strength;
        $server->status = $request->status;

        $server->error_count = 0;
        $server->recover_count = config('bigbluebutton.server_online_threshold');

        // Check if server is online/offline and update usage data
        $serverService = new ServerService($server);
        $serverService->updateUsage();

        $server->save();

        return (new ServerResource($server))->withApi();
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return JsonResponse|Response
     *
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
                'error' => CustomStatusCodes::STALE_MODEL->value,
                'message' => __('app.errors.server_delete_failed'),
            ], CustomStatusCodes::STALE_MODEL->value);
        }
    }

    /**
     * Panic server, change status of the server to disabled and
     * end all meetings running on this server
     */
    public function panic(Request $request, Server $server)
    {
        $serverService = new ServerService($server);
        $result = $serverService->panic();

        return \response()->json($result);
    }

    /**
     * Check if this backend can connect to a bbb server with the api credentials in this request
     *
     * @return JsonResponse
     */
    public function check(ServerConnectionCheckRequest $request)
    {
        $connectionOk = false;
        $secretOk = false;

        try {
            $bbb = new BigBlueButton($request->base_url, $request->secret, new LaravelHTTPClient);
            $response = $bbb->getMeetings();

            if ($response->success()) {
                $connectionOk = true;
                $secretOk = true;
            } elseif ($response->hasChecksumError()) {
                $connectionOk = true;
                $secretOk = false;
            }
        } catch (\Exception $e) {
        }

        return \response()->json(['connection_ok' => $connectionOk, 'secret_ok' => $secretOk]);
    }
}
