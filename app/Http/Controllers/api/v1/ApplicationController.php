<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSetting;
use App\Http\Resources\ApplicationSettings;
use App\Http\Resources\User as UserResource;
use App\Models\Meeting;
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
        // Logo for frontend
        if ($request->has('logo_file')) {
            $path = $request->file('logo_file')->store('images', 'public');
            $url  = Storage::url($path);
            $logo = $url;
        } else {
            $logo = $request->logo;
        }

        // Favicon for frontend
        if ($request->has('favicon_file')) {
            $path    = $request->file('favicon_file')->store('images', 'public');
            $url     = Storage::url($path);
            $favicon = $url;
        } else {
            $favicon = $request->favicon;
        }

        // Default presentation for BBB
        if ($request->has('default_presentation')) {
            if (!empty(setting('default_presentation'))) {
                Storage::deleteDirectory('public/default_presentation');
            }
            if (!empty($request->file('default_presentation'))) {
                $file = $request->file('default_presentation');
                $path = $file->storeAs('default_presentation', 'default.' . $file->clientExtension(), 'public');
                setting()->set('default_presentation', Storage::disk('public')->url($path));
            } else {
                setting()->forget('default_presentation');
            }
        }

        // Logo for BBB
        if ($request->has('bbb.logo_file')) {
            $path = $request->file('bbb.logo_file')->store('images', 'public');
            $url  = Storage::url($path);
            setting()->set('bbb_logo', url($url));
        } elseif ($request->has('bbb.logo') && trim($request->bbb['logo']) != '') {
            setting()->set('bbb_logo', $request->bbb['logo']);
        } else {
            setting()->forget('bbb_logo');
        }

        // Custom style file for BBB
        if ($request->has('bbb.style')) {
            if (!empty($request->file('bbb.style'))) {
                $path = $request->file('bbb.style')->storeAs('styles', 'bbb.css', 'public');
                $url  = Storage::url($path);
                setting()->set('bbb_style', url($url));
            } else {
                Storage::disk('public')->delete('styles/bbb.css');
                setting()->forget('bbb_style');
            }
        }

        setting()->set('logo', $logo);
        setting()->set('favicon', $favicon);
        setting()->set('name', $request->name);
        setting()->set('room_limit', $request->room_limit);
        setting()->set('room_pagination_page_size', $request->room_pagination_page_size);
        setting()->set('pagination_page_size', $request->pagination_page_size);
        setting()->set('password_change_allowed', $request->password_change_allowed);
        setting()->set('default_timezone', $request->default_timezone);
        setting()->set('room_token_expiration', $request->room_token_expiration);
        setting()->set('banner', array_filter($request->banner, function ($setting) {
            return $setting !== null;
        }));

        // reset record_attendance for running meetings and remove attendance data,
        // as new attendees would not see a warning, but are recorded
        // if this global setting is re-enabled during the meeting
        if (setting('attendance.enabled') && !$request->attendance['enabled']) {
            $meetings = Meeting::whereNull('end')->where('record_attendance', '=', 1)->get();
            foreach ($meetings as $meeting) {
                $meeting->record_attendance = false;
                $meeting->save();
                $meeting->attendees()->delete();
            }
        }

        setting()->set('statistics.servers.enabled', $request->statistics['servers']['enabled']);
        setting()->set('statistics.servers.retention_period', $request->statistics['servers']['retention_period']);
        setting()->set('statistics.meetings.enabled', $request->statistics['meetings']['enabled']);
        setting()->set('statistics.meetings.retention_period', $request->statistics['meetings']['retention_period']);
        setting()->set('attendance.enabled', $request->attendance['enabled']);
        setting()->set('attendance.retention_period', $request->attendance['retention_period']);

        setting()->set('room_auto_delete.enabled', $request->room_auto_delete['enabled'] && !($request->room_auto_delete['inactive_period'] == -1 && $request->room_auto_delete['never_used_period'] == -1));
        setting()->set('room_auto_delete.inactive_period', $request->room_auto_delete['inactive_period']);
        setting()->set('room_auto_delete.never_used_period', $request->room_auto_delete['never_used_period']);
        setting()->set('room_auto_delete.deadline_period', $request->room_auto_delete['deadline_period']);

        if (!empty($request->help_url)) {
            setting()->set('help_url', $request->help_url);
        } else {
            setting()->forget('help_url');
        }

        if (!empty($request->legal_notice_url)) {
            setting()->set('legal_notice_url', $request->legal_notice_url);
        } else {
            setting()->forget('legal_notice_url');
        }

        if (!empty($request->privacy_policy_url)) {
            setting()->set('privacy_policy_url', $request->privacy_policy_url);
        } else {
            setting()->forget('privacy_policy_url');
        }

        setting()->save();

        return (new ApplicationSettings())->allSettings();
    }

    /**
     * Load current user
     * @return UserResource
     */
    public function currentUser()
    {
        return (new UserResource(Auth::user()))->withPermissions()->withoutRoles();
    }
}
