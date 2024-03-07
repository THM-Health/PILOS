<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('meetings', function (Blueprint $table) {
            $table->renameColumn('attendeePW', 'attendee_pw');
            $table->renameColumn('moderatorPW', 'moderator_pw');
            $table->renameColumn('isBreakout', 'is_breakout');
        });
        Schema::table('rooms', function (Blueprint $table) {
            $table->renameColumn('maxParticipants', 'max_participants');
            $table->renameColumn('webcamsOnlyForModerator', 'webcams_only_for_moderator');
            $table->renameColumn('muteOnStart', 'mute_on_start');
            $table->renameColumn('lockSettingsDisableCam', 'lock_settings_disable_cam');
            $table->renameColumn('lockSettingsDisableMic', 'lock_settings_disable_mic');
            $table->renameColumn('lockSettingsDisablePrivateChat', 'lock_settings_disable_private_chat');
            $table->renameColumn('lockSettingsDisablePublicChat', 'lock_settings_disable_public_chat');
            $table->renameColumn('lockSettingsDisableNote', 'lock_settings_disable_note');
            $table->renameColumn('lockSettingsLockOnJoin', 'lock_settings_lock_on_join');
            $table->renameColumn('lockSettingsHideUserList', 'lock_settings_hide_user_list');
            $table->renameColumn('allowGuests', 'allow_guests');
            $table->renameColumn('defaultRole', 'default_role');
            $table->renameColumn('allowMembership', 'allow_membership');
            $table->renameColumn('everyoneCanStart', 'everyone_can_start');
            $table->renameColumn('accessCode', 'access_code');
            $table->dropColumn('everyoneModerator');
        });
        Schema::table('room_files', function (Blueprint $table) {
            $table->renameColumn('useinmeeting', 'use_in_meeting');
        });
    }

    public function down()
    {
        Schema::table('', function (Blueprint $table) {

        });
    }
};
