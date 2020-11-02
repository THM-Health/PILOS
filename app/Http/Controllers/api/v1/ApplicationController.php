<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSetting;
use App\Http\Resources\ApplicationSettings;
use App\Http\Resources\User as UserResource;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ApplicationController extends Controller
{
    /**
     * Load basic application data, like settings
     * @return ApplicationSettings
     */
    public function settings()
    {
        return new ApplicationSettings();
    }

    /**
     * Update application settings data
     * @param  UpdateSetting       $request
     * @return ApplicationSettings
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

        return new ApplicationSettings();
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
