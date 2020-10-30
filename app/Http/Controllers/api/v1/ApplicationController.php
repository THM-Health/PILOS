<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSetting;
use App\Http\Resources\User as UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

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
        $data = $request->all();

        if ($request->has('logo_file')) {
            $path         = $request->file('logo_file')->store('images', 'public');
            $url          = Storage::url($path);
            $data['logo'] = $url;
        }

        // Settings defaults array keys for validation
        $setting_keys = collect(config('settings.defaults'))->keys()->toArray();

        foreach ($data as $key => $value) {
            // If key exists in the settings array keys then update settings
            if (in_array($key, $setting_keys)) {
                setting([$key => $value])->save();
            }
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
