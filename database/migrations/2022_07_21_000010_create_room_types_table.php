<?php

use Database\Seeders\RoomTypeSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('room_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description', 5000)->nullable();
            $table->string('color', 7);
            $table->boolean('restrict')->default(false);
            $table->foreignId('server_pool_id')->constrained()->onDelete('restrict');
            $table->integer('max_participants')->nullable();
            $table->integer('max_duration')->nullable();

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
            $table->boolean('record_attendance_default')->default(false);
            $table->boolean('record_attendance_enforced')->default(false);
            $table->boolean('record_default')->default(false);
            $table->boolean('record_enforced')->default(false);
            $table->boolean('auto_start_recording_default')->default(false);
            $table->boolean('auto_start_recording_enforced')->default(false);
            $table->integer('visibility_default')->default(\App\Enums\RoomVisibility::PRIVATE);
            $table->boolean('visibility_enforced')->default(false);

            $table->boolean('has_access_code_enforced')->default(false);
            $table->boolean('has_access_code_default')->default(true);

            $table->timestamps();
        });

        $seeder = new RoomTypeSeeder();
        $seeder->run();
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('room_types');
    }
};
