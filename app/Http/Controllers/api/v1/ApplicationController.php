<?php

declare(strict_types=1);

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConfigResource;
use App\Http\Resources\UserResource;
use Illuminate\Support\Facades\Auth;

class ApplicationController extends Controller
{
    /**
     * Load basic application data, like settings
     *
     * @return ConfigResource
     */
    public function config()
    {
        return new ConfigResource;
    }

    /**
     * Load current user
     *
     * @return UserResource
     */
    public function currentUser()
    {
        return (new UserResource(Auth::user()))->withPermissions()->withoutRoles();
    }
}
