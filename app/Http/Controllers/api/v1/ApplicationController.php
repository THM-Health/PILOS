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
              'logo'                 => setting('logo'),
              'room_limit'           => setting('room_limit'),
              'pagination_page_size' => setting('pagination_page_size'),
              'bbb'                  => [
                  'file_mimes'              => config('bigbluebutton.allowed_file_mimes'),
                  'max_filesize'            => config('bigbluebutton.max_filesize'),
                  'room_name_limit'         => config('bigbluebutton.room_name_limit'),
                  'welcome_message_limit'   => config('bigbluebutton.welcome_message_limit')
              ]
          ]
        ]);
    }

    /**
     * Load current user
     * @return UserResource
     */
    public function currentUser()
    {
        return (new UserResource(Auth::user()))->withPermissions();
    }
}
