<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PermissionResourceCollection;
use App\Models\Permission;

class PermissionController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return PermissionResourceCollection
     */
    public function index()
    {
        return (new PermissionResourceCollection(Permission::all()))->additional([
            'meta' => [
                'restrictions' => config('permissions.restrictions'),
            ],
        ]);
    }
}
