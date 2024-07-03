<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\LinkButtonStyle;
use App\Enums\LinkTarget;
use App\Enums\TimePeriod;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSettings;
use App\Http\Resources\Settings;
use App\Http\Resources\Config;
use App\Http\Resources\User as UserResource;
use App\Settings\BannerSettings;
use App\Settings\BigBlueButtonSettings;
use App\Settings\GeneralSettings;
use App\Settings\RecordingSettings;
use App\Settings\RoomSettings;
use App\Settings\UserSettings;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ApplicationController extends Controller
{
    /**
     * Load basic application data, like settings
     *
     * @return Config
     */
    public function config()
    {
        return new Config();
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
