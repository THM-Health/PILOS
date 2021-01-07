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
     * Load all settings, also complete banner settings when the banner is disabled.
     */
    public function allSettings()
    {
        return (new ApplicationSettings())->allSettings();
    }

    /**
     * Update application settings data
     * @param  UpdateSetting       $request
     * @return ApplicationSettings
     */
    public function updateSettings(UpdateSetting $request)
    {
        if ($request->has('logo_file')) {
            $path = $request->file('logo_file')->store('images', 'public');
            $url  = Storage::url($path);
            $logo = $url;
        } else {
            $logo = $request->logo;
        }

        if ($request->has('favicon_file')) {
            $path    = $request->file('favicon_file')->store('images', 'public');
            $url     = Storage::url($path);
            $favicon = $url;
        } else {
            $favicon = $request->favicon;
        }

        setting()->set('logo', $logo);
        setting()->set('favicon', $favicon);
        setting()->set('name', $request->name);
        setting()->set('room_limit', $request->room_limit);
        setting()->set('own_rooms_pagination_page_size', $request->own_rooms_pagination_page_size);
        setting()->set('pagination_page_size', $request->pagination_page_size);
        setting()->set('banner', array_filter($request->banner, function ($setting) {
            return $setting !== null;
        }));
        setting()->save();

        return (new ApplicationSettings())->allSettings();
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
