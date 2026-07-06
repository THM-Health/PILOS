<?php

// SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

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
