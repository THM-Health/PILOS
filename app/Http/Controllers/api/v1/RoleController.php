<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\CustomStatusCodes;
use App\Http\Controllers\Controller;
use App\Http\Requests\RoleRequest;
use App\Http\Resources\Role as RoleResource;
use App\Models\Role;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class RoleController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Role::class, 'role');
        $this->middleware('check.stale:role,\App\Http\Resources\Role,withPermissions', ['only' => 'update']);
    }

    /**
     * Display a listing of the resource.
     *
     * @return AnonymousResourceCollection
     */
    public function index(Request $request)
    {
        $additionalMeta = [];
        $resource       = Role::query();

        if ($request->has('sort_by') && $request->has('sort_direction')) {
            $by  = $request->query('sort_by');
            $dir = $request->query('sort_direction');

            if (in_array($by, ['id', 'name', 'default']) && in_array($dir, ['asc', 'desc'])) {
                $resource = $resource->orderBy($by, $dir);
            }
        }

        // count all before search
        $additionalMeta['meta']['total_no_filter'] = $resource->count();

        if ($request->has('name')) {
            $resource = $resource->withName($request->query('name'));
        }

        $resource = $resource->paginate(setting('pagination_page_size'));

        return RoleResource::collection($resource)->additional($additionalMeta);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  RoleRequest  $request
     * @return RoleResource
     */
    public function store(RoleRequest $request)
    {
        $role             = new Role;
        $role->name       = $request->name;
        $role->room_limit = $request->room_limit;
        $role->superuser  = false;

        $role->save();
        $role->permissions()->sync($request->permissions);

        return (new RoleResource($role))->withPermissions();
    }

    /**
     * Display the specified resource.
     *
     * @param  Role         $role
     * @return RoleResource
     */
    public function show(Role $role)
    {
        return (new RoleResource($role))->withPermissions();
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  RoleRequest               $request
     * @param  Role                      $role
     * @return RoleResource|JsonResponse
     */
    public function update(RoleRequest $request, Role $role)
    {
        // Cannot change room_limit or permissions for superuser role
        if (!$role->superuser) {
            $old_role_permissions = $role->permissions()->pluck('permissions.id')->toArray();

            $role->permissions()->sync($request->permissions);

            $user = Auth::user();

            if (!($user->hasPermission('settings.manage')
                && $user->hasPermission('roles.viewAny')
                && $user->hasPermission('roles.view')
                && $user->hasPermission('roles.update'))) {
                $role->permissions()->sync($old_role_permissions);

                return response()->json([
                    'error'   => CustomStatusCodes::ROLE_UPDATE_PERMISSION_LOST,
                    'message' => __('app.errors.role_update_permission_lost')
                ], CustomStatusCodes::ROLE_UPDATE_PERMISSION_LOST);
            }

            // Ensure updated refreshed even if nothing was changed!
            $role->touch();

            $role->room_limit = $request->room_limit;
        }

        $role->name       = $request->name;
        $role->save();

        return (new RoleResource($role))->withPermissions();
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  Role                  $role
     * @return JsonResponse|Response
     * @throws Exception
     */
    public function destroy(Role $role)
    {
        $role->loadCount('users');
        if ($role->users_count != 0) {
            return response()->json([
                'error'   => CustomStatusCodes::ROLE_DELETE_LINKED_USERS,
                'message' => __('app.errors.role_delete_linked_users')
            ], CustomStatusCodes::ROLE_DELETE_LINKED_USERS);
        }

        $role->delete();

        return response()->noContent();
    }
}
