<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->boolean('webcams_only_for_moderator_default')->default(false);
            $table->boolean('webcams_only_for_moderator_enforced')->default(false);
            $table->boolean('mute_on_start_default')->default(false);
            $table->boolean('mute_on_start_enforced')->default(false);
            $table->boolean('lock_settings_disable_cam_default')->default(false);
            $table->boolean('lock_settings_disable_cam_enforced')->default(false);
            $table->boolean('lock_settings_disable_mic_default')->default(false);
            $table->boolean('lock_settings_disable_mic_enforced')->default(false);
            $table->boolean('lock_settings_disable_private_chat_default')->default(false);
            $table->boolean('lock_settings_disable_private_chat_enforced')->default(false);
            $table->boolean('lock_settings_disable_public_chat_default')->default(false);
            $table->boolean('lock_settings_disable_public_chat_enforced')->default(false);
            $table->boolean('lock_settings_disable_note_default')->default(false);
            $table->boolean('lock_settings_disable_note_enforced')->default(false);
            $table->boolean('lock_settings_hide_user_list_default')->default(false);
            $table->boolean('lock_settings_hide_user_list_enforced')->default(false);
            $table->boolean('everyone_can_start_default')->default(false);
            $table->boolean('everyone_can_start_enforced')->default(false);
            $table->boolean('allow_guests_default')->default(false);
            $table->boolean('allow_guests_enforced')->default(false);
            $table->boolean('allow_membership_default')->default(false);
            $table->boolean('allow_membership_enforced')->default(false);
            $table->integer('default_role_default')->default(\App\Enums\RoomUserRole::USER);
            $table->integer('default_role_enforced')->default(false);
            $table->integer('lobby_default')->default(\App\Enums\RoomLobby::DISABLED);
            $table->integer('lobby_enforced')->default(\App\Enums\RoomLobby::DISABLED);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->dropColumn('webcams_only_for_moderator_default');
            $table->dropColumn('webcams_only_for_moderator_enforced');
            $table->dropColumn('mute_on_start_default');
            $table->dropColumn('mute_on_start_enforced');
            $table->dropColumn('lock_settings_disable_cam_default');
            $table->dropColumn('lock_settings_disable_cam_enforced');
            $table->dropColumn('lock_settings_disable_mic_default');
            $table->dropColumn('lock_settings_disable_mic_enforced');
            $table->dropColumn('lock_settings_disable_private_chat_default');
            $table->dropColumn('lock_settings_disable_private_chat_enforced');
            $table->dropColumn('lock_settings_disable_public_chat_default');
            $table->dropColumn('lock_settings_disable_public_chat_enforced');
            $table->dropColumn('lock_settings_disable_note_default');
            $table->dropColumn('lock_settings_disable_note_enforced');
            $table->dropColumn('lock_settings_hide_user_list_default');
            $table->dropColumn('lock_settings_hide_user_list_enforced');
            $table->dropColumn('everyone_can_start_default');
            $table->dropColumn('everyone_can_start_enforced');
            $table->dropColumn('allow_guests_default');
            $table->dropColumn('allow_guests_enforced');
            $table->dropColumn('allow_membership_default');
            $table->dropColumn('allow_membership_enforced');
            $table->dropColumn('default_role_default');
            $table->dropColumn('default_role_enforced');
            $table->dropColumn('lobby_default');
            $table->dropColumn('lobby_enforced');
        });
    }
};
