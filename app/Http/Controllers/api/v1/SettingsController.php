<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\LinkButtonStyle;
use App\Enums\LinkTarget;
use App\Enums\TimePeriod;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSettings;
use App\Http\Resources\Config;
use App\Http\Resources\Settings;
use App\Settings\BannerSettings;
use App\Settings\BigBlueButtonSettings;
use App\Settings\GeneralSettings;
use App\Settings\RecordingSettings;
use App\Settings\RoomSettings;
use App\Settings\UserSettings;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    /**
     * Show config
     */
    public function view()
    {
        return (new Settings())->additional([
            'meta' => [
                'link_btn_styles' => LinkButtonStyle::cases(),
                'link_targets' => LinkTarget::cases(),
                'recording_max_retention_period' => config('recording.max_retention_period'),
            ],
        ]);
    }

    /**
     * Update application config
     *
     * @return Config
     */
    public function update(UpdateSettings $request)
    {
        $generalSettings = app(GeneralSettings::class);
        $bannerSettings = app(BannerSettings::class);
        $roomSettings = app(RoomSettings::class);
        $userSettings = app(UserSettings::class);
        $recordingSettings = app(RecordingSettings::class);
        $bigBlueButtonSettings = app(BigBlueButtonSettings::class);

        // Logo for frontend
        if ($request->has('general_logo_file')) {
            $path = $request->file('general_logo_file')->store('images', 'public');
            $url = Storage::url($path);
            $logo = $url;
        } else {
            $logo = $request->input('general_logo');
        }

        // Favicon for frontend
        if ($request->has('general_favicon_file')) {
            $path = $request->file('general_favicon_file')->store('images', 'public');
            $url = Storage::url($path);
            $favicon = $url;
        } else {
            $favicon = $request->input('general_favicon');
        }

        // Default presentation for BBB
        if ($request->has('bbb_default_presentation')) {
            if ($bigBlueButtonSettings->default_presentation != null) {
                Storage::deleteDirectory('public/default_presentation');
            }
            if (! empty($request->file('bbb_default_presentation'))) {
                $file = $request->file('bbb_default_presentation');
                $path = $file->storeAs('default_presentation', 'default.'.$file->clientExtension(), 'public');
                $bigBlueButtonSettings->default_presentation = Storage::disk('public')->url($path);
            } else {
                $bigBlueButtonSettings->default_presentation = null;
            }
        }

        // Logo for BBB
        if ($request->has('bbb_logo_file')) {
            $path = $request->file('bbb_logo_file')->store('images', 'public');
            $url = Storage::url($path);
            $bigBlueButtonSettings->logo = url($url);
        } elseif ($request->has('bbb_logo') && trim($request->input('bbb_logo') != '')) {
            $bigBlueButtonSettings->logo = $request->input('bbb_logo');
        } else {
            $bigBlueButtonSettings->logo = null;
        }

        // Custom style file for BBB
        if ($request->has('bbb_style')) {
            if (! empty($request->file('bbb_style'))) {
                $path = $request->file('bbb_style')->storeAs('styles', 'bbb.css', 'public');
                $url = Storage::url($path);
                $bigBlueButtonSettings->style = url($url);
            } else {
                Storage::disk('public')->delete('styles/bbb.css');
                $bigBlueButtonSettings->style = null;
            }
        }

        $generalSettings->logo = $logo;
        $generalSettings->favicon = $favicon;
        $generalSettings->name = $request->input('general_name');
        $generalSettings->pagination_page_size = $request->integer('general_pagination_page_size');
        $generalSettings->default_timezone = $request->input('general_default_timezone');
        $generalSettings->help_url = $request->input('general_help_url');
        $generalSettings->legal_notice_url = $request->input('general_legal_notice_url');
        $generalSettings->privacy_policy_url = $request->input('general_privacy_policy_url');
        $generalSettings->toast_lifetime = $request->integer('general_toast_lifetime');

        $roomSettings->limit = $request->integer('room_limit');
        $roomSettings->pagination_page_size = $request->integer('room_pagination_page_size');
        $roomSettings->token_expiration = $request->enum('room_token_expiration', TimePeriod::class);
        $roomSettings->auto_delete_inactive_period = $request->enum('room_auto_delete_inactive_period', TimePeriod::class);
        $roomSettings->auto_delete_never_used_period = $request->enum('room_auto_delete_never_used_period', TimePeriod::class);
        $roomSettings->auto_delete_deadline_period = $request->enum('room_auto_delete_deadline_period', TimePeriod::class);

        $userSettings->password_change_allowed = $request->boolean('user_password_change_allowed');

        $bannerSettings->enabled = $request->boolean('banner_enabled');
        $bannerSettings->title = $request->input('banner_title');
        $bannerSettings->icon = $request->input('banner_icon');
        $bannerSettings->message = $request->input('banner_message');
        $bannerSettings->link = $request->input('banner_link');
        $bannerSettings->link_text = $request->input('banner_link_text');
        $bannerSettings->link_style = $request->enum('banner_link_style', LinkButtonStyle::class);
        $bannerSettings->link_target = $request->enum('banner_link_target', LinkTarget::class);
        $bannerSettings->color = $request->input('banner_color');
        $bannerSettings->background = $request->input('banner_background');

        $recordingSettings->server_usage_enabled = $request->boolean('recording_server_usage_enabled');
        $recordingSettings->server_usage_retention_period = $request->enum('recording_server_usage_retention_period', TimePeriod::class);
        $recordingSettings->meeting_usage_enabled = $request->boolean('recording_meeting_usage_enabled');
        $recordingSettings->meeting_usage_retention_period = $request->enum('recording_meeting_usage_retention_period', TimePeriod::class);
        $recordingSettings->attendance_retention_period = $request->enum('recording_attendance_retention_period', TimePeriod::class);
        $recordingSettings->recording_retention_period = $request->enum('recording_recording_retention_period', TimePeriod::class);

        $generalSettings->save();
        $roomSettings->save();
        $userSettings->save();
        $bannerSettings->save();
        $recordingSettings->save();
        $bigBlueButtonSettings->save();

        return $this->view();
    }
}
