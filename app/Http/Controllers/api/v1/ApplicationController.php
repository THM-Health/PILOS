<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\User as UserResource;
use Illuminate\Support\Facades\Auth;

class ApplicationController extends Controller
{
    /**
     * Load basic application data, like settings
     * @return \Illuminate\Http\JsonResponse
     */
    public function settings()
    {
        return response()->json(['data' => [
              'logo'              => setting('logo'),
              'open_registration' => setting('open_registration')
          ]
        ]);
    }

    /**
     * Load current user
     * @return UserResource
     */
    public function currentUser()
    {
        return new UserResource(Auth::user(), true);
    }
}
