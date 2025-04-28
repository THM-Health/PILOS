<?php

namespace App\Http\Resources;

use App\Settings\BannerSettings;
use App\Settings\BigBlueButtonSettings;
use App\Settings\GeneralSettings;
use App\Settings\RecordingSettings;
use App\Settings\RoomSettings;
use App\Settings\ThemeSettings;
use App\Settings\UserSettings;
use Illuminate\Http\Resources\Json\JsonResource;

class Settings extends JsonResource
{
    public function __construct()
    {
        parent::__construct(null);
    }

    /**
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        $generalSettings = app(GeneralSettings::class);
        $themeSettings = app(ThemeSettings::class);
        $bannerSettings = app(BannerSettings::class);
        $roomSettings = app(RoomSettings::class);
        $userSettings = app(UserSettings::class);
        $recordingSettings = app(RecordingSettings::class);
        $bigBlueButtonSettings = app(BigBlueButtonSettings::class);

        return [
            'general_name' => $generalSettings->name,
            'general_pagination_page_size' => $generalSettings->pagination_page_size,
            'general_toast_lifetime' => $generalSettings->toast_lifetime,
            'general_default_timezone' => $generalSettings->default_timezone,
            'general_help_url' => $generalSettings->help_url,
            'general_legal_notice_url' => $generalSettings->legal_notice_url,
            'general_privacy_policy_url' => $generalSettings->privacy_policy_url,
            'general_no_welcome_page' => $generalSettings->no_welcome_page,
            'theme_logo' => $themeSettings->logo,
            'theme_favicon' => $themeSettings->favicon,
            'theme_logo_dark' => $themeSettings->logo_dark,
            'theme_favicon_dark' => $themeSettings->favicon_dark,
            'theme_primary_color' => $themeSettings->primary_color,
            'theme_rounded' => $themeSettings->rounded,
            'banner_enabled' => $bannerSettings->enabled,
            'banner_message' => $bannerSettings->message,
            'banner_link' => $bannerSettings->link,
            'banner_icon' => $bannerSettings->icon,
            'banner_color' => $bannerSettings->color,
            'banner_background' => $bannerSettings->background,
            'banner_title' => $bannerSettings->title,
            'banner_link_style' => $bannerSettings->link_style,
            'banner_link_text' => $bannerSettings->link_text,
            'banner_link_target' => $bannerSettings->link_target,
            'room_limit' => $roomSettings->limit,
            'room_auto_delete_inactive_period' => $roomSettings->auto_delete_inactive_period,
            'room_auto_delete_never_used_period' => $roomSettings->auto_delete_never_used_period,
            'room_auto_delete_deadline_period' => $roomSettings->auto_delete_deadline_period,
            'room_token_expiration' => $roomSettings->token_expiration,
            'room_file_terms_of_use' => $roomSettings->file_terms_of_use,
            'user_password_change_allowed' => $userSettings->password_change_allowed,
            'recording_server_usage_enabled' => $recordingSettings->server_usage_enabled,
            'recording_server_usage_retention_period' => $recordingSettings->server_usage_retention_period,
            'recording_meeting_usage_enabled' => $recordingSettings->meeting_usage_enabled,
            'recording_meeting_usage_retention_period' => $recordingSettings->meeting_usage_retention_period,
            'recording_attendance_retention_period' => $recordingSettings->attendance_retention_period,
            'recording_recording_retention_period' => $recordingSettings->recording_retention_period,
            'bbb_logo' => $bigBlueButtonSettings->logo,
            'bbb_logo_dark' => $bigBlueButtonSettings->logo_dark,
            'bbb_style' => $bigBlueButtonSettings->style,
            'bbb_default_presentation' => $bigBlueButtonSettings->default_presentation,
        ];
    }
}
