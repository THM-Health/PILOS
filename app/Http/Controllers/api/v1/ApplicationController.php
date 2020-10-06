<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSetting;
use App\Http\Resources\User as UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ApplicationController extends Controller
{
    /**
     * Load basic application data, like settings
     * @return JsonResponse
     */
    public function settings()
    {
        return response()->json(['data' => [
            'logo'                           => setting('logo'),
            'room_limit'                     => setting('room_limit'),
            'pagination_page_size'           => setting('pagination_page_size'),
            'own_rooms_pagination_page_size' => setting('own_rooms_pagination_page_size'),
            'bbb'                            => [
                'file_mimes'            => config('bigbluebutton.allowed_file_mimes'),
                'max_filesize'          => config('bigbluebutton.max_filesize'),
                'room_name_limit'       => config('bigbluebutton.room_name_limit'),
                'welcome_message_limit' => config('bigbluebutton.welcome_message_limit')
            ]
        ]
        ]);
    }

    /**
     * Update application settings data
     * @param  UpdateSetting $request
     * @return JsonResponse
     */
    public function updateSettings(UpdateSetting $request)
    {
        // Check whether logged in user has permission to manage settings
        if (Auth::user()->cant('settings.manage')) {
            abort(403);
        }

        $data = $request->all();

        foreach ($data as $key => $value) {
            setting([$key => $value])->save();
        }

        return response()->json(['data' => [
            'logo'                           => setting('logo'),
            'room_limit'                     => setting('room_limit'),
            'pagination_page_size'           => setting('pagination_page_size'),
            'own_rooms_pagination_page_size' => setting('own_rooms_pagination_page_size')
        ]], 201);
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
