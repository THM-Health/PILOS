<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Config;
use App\Http\Resources\Settings;
use App\Http\Resources\User as UserResource;
use Illuminate\Support\Facades\Auth;

class ApplicationController extends Controller
{
    /**
     * Load basic application data, like settings
     *
     * @return Config
     */
    public function config()
    {
        return new Config;
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
