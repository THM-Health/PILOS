<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\User as UserResource;
use Illuminate\Support\Facades\Auth;

class ApplicationController extends Controller
{
    /**
     * Load basic application data, like settings and currently logged in user
     * @return \Illuminate\Http\JsonResponse
     */
    public function application()
    {
        return response()->json(['data' => [
          'settings' => [
              'logo'       => setting('logo'),
              'room_limit' => Auth::guest() ? setting('room_limit') : Auth::user()->room_limit
          ],
          'user' => new UserResource(Auth::user(), true)
        ]]);
    }
}
