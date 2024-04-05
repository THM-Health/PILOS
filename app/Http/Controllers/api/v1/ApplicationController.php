<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\LinkButtonStyle;
use App\Enums\LinkTarget;
use App\Enums\TimePeriod;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSetting;
use App\Http\Resources\ApplicationSettings;
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
     *
     * @return ApplicationSettings
     */
    public function updateSettings(UpdateSetting $request)
    {
        $generalSettings = app(GeneralSettings::class);
        $bannerSettings = app(BannerSettings::class);
        $roomSettings = app(RoomSettings::class);
        $userSettings = app(UserSettings::class);
        $recordingSettings = app(RecordingSettings::class);
        $bigBlueButtonSettings = app(BigBlueButtonSettings::class);

        // Logo for frontend
        if ($request->has('logo_file')) {
            $path = $request->file('logo_file')->store('images', 'public');
            $url = Storage::url($path);
            $logo = $url;
        } else {
            $logo = $request->input('logo');
        }

        // Favicon for frontend
        if ($request->has('favicon_file')) {
            $path = $request->file('favicon_file')->store('images', 'public');
            $url = Storage::url($path);
            $favicon = $url;
        } else {
            $favicon = $request->input('favicon');
        }

        // Default presentation for BBB
        if ($request->has('bbb.default_presentation')) {
            if ($bigBlueButtonSettings->default_presentation != null) {
                Storage::deleteDirectory('public/default_presentation');
            }
            if (! empty($request->file('bbb.default_presentation'))) {
                $file = $request->file('bbb.default_presentation');
                $path = $file->storeAs('default_presentation', 'default.'.$file->clientExtension(), 'public');
                $bigBlueButtonSettings->default_presentation = Storage::disk('public')->url($path);
            } else {
                $bigBlueButtonSettings->default_presentation = null;
            }
        }

        // Logo for BBB
        if ($request->has('bbb.logo_file')) {
            $path = $request->file('bbb.logo_file')->store('images', 'public');
            $url = Storage::url($path);
            $bigBlueButtonSettings->logo = url($url);
        } elseif ($request->has('bbb.logo') && trim($request->input('bbb.logo') != '')) {
            $bigBlueButtonSettings->logo = $request->input('bbb.logo');
        } else {
            $bigBlueButtonSettings->logo = null;
        }

        // Custom style file for BBB
        if ($request->has('bbb.style')) {
            if (! empty($request->file('bbb.style'))) {
                $path = $request->file('bbb.style')->storeAs('styles', 'bbb.css', 'public');
                $url = Storage::url($path);
                $bigBlueButtonSettings->style = url($url);
            } else {
                Storage::disk('public')->delete('styles/bbb.css');
                $bigBlueButtonSettings->style = null;
            }
        }

        $generalSettings->logo = $logo;
        $generalSettings->favicon = $favicon;
        $generalSettings->name = $request->input('name');
        $generalSettings->pagination_page_size = $request->integer('pagination_page_size');
        $generalSettings->default_timezone = $request->input('default_timezone');
        $generalSettings->help_url = $request->input('help_url');
        $generalSettings->legal_notice_url = $request->input('legal_notice_url');
        $generalSettings->privacy_policy_url = $request->input('privacy_policy_url');

        $roomSettings->limit = $request->integer('room_limit');
        $roomSettings->pagination_page_size = $request->integer('room_pagination_page_size');
        $roomSettings->token_expiration = $request->enum('room_token_expiration', TimePeriod::class);
        $roomSettings->auto_delete_inactive_period = $request->enum('room_auto_delete.inactive_period', TimePeriod::class);
        $roomSettings->auto_delete_never_used_period = $request->enum('room_auto_delete.never_used_period', TimePeriod::class);
        $roomSettings->auto_delete_deadline_period = $request->enum('room_auto_delete.deadline_period', TimePeriod::class);

        $userSettings->password_change_allowed = $request->boolean('password_change_allowed');

        $bannerSettings->enabled = $request->boolean('banner.enabled');
        $bannerSettings->title = $request->input('banner.title');
        $bannerSettings->icon = $request->input('banner.icon');
        $bannerSettings->message = $request->input('banner.message');
        $bannerSettings->link = $request->input('banner.link');
        $bannerSettings->link_text = $request->input('banner.link_text');
        $bannerSettings->link_style = $request->enum('banner.link_style', LinkButtonStyle::class);
        $bannerSettings->link_target = $request->enum('banner.link_target', LinkTarget::class);
        $bannerSettings->color = $request->input('banner.color');
        $bannerSettings->background = $request->input('banner.background');

        $recordingSettings->server_usage_enabled = $request->boolean('statistics.servers.enabled');
        $recordingSettings->server_usage_retention_period = $request->enum('statistics.servers.retention_period', TimePeriod::class);
        $recordingSettings->meeting_usage_enabled = $request->boolean('statistics.meetings.enabled');
        $recordingSettings->meeting_usage_retention_period = $request->enum('statistics.meetings.retention_period', TimePeriod::class);
        $recordingSettings->attendance_retention_period = $request->enum('attendance.retention_period', TimePeriod::class);

        $generalSettings->save();
        $roomSettings->save();
        $userSettings->save();
        $bannerSettings->save();
        $recordingSettings->save();
        $bigBlueButtonSettings->save();

        return (new ApplicationSettings())->allSettings();
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
