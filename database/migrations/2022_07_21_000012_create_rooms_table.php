<?php

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
        Schema::create('rooms', function (Blueprint $table) {
            $table->string('id', 15);
            $table->primary('id');
            $table->string('name', 256);
            $table->text('description')->nullable();
            $table->string('short_description', 300)->nullable();
            $table->string('welcome', 5000)->nullable();
            $table->boolean('webcams_only_for_moderator')->default(false);
            $table->boolean('mute_on_start')->default(false);
            $table->boolean('lock_settings_disable_cam')->default(false);
            $table->boolean('lock_settings_disable_mic')->default(false);
            $table->boolean('lock_settings_disable_private_chat')->default(false);
            $table->boolean('lock_settings_disable_public_chat')->default(false);
            $table->boolean('lock_settings_disable_note')->default(false);
            $table->boolean('lock_settings_lock_on_join')->default(true);
            $table->boolean('lock_settings_hide_user_list')->default(false);
            $table->boolean('allow_guests')->default(false);
            $table->integer('default_role')->default(\App\Enums\RoomUserRole::USER);
            $table->integer('lobby')->default(\App\Enums\RoomLobby::DISABLED);
            $table->boolean('allow_membership')->default(false);
            $table->boolean('everyone_can_start')->default(false);
            $table->boolean('everyone_moderator')->default(false);
            $table->integer('access_code')->length(11)->nullable();
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unsignedBigInteger('room_type_id');
            $table->foreign('room_type_id')->references('id')->on('room_types')->onDelete('restrict');

            $table->integer('participant_count')->nullable();
            $table->integer('listener_count')->nullable();
            $table->integer('voice_participant_count')->nullable();
            $table->integer('video_count')->nullable();
            $table->boolean('visibility')->default(\App\Enums\RoomVisibility::PRIVATE);

            $table->boolean('record_attendance')->default(false);
            $table->boolean('record')->default(false);
            $table->boolean('auto_start_recording')->default(false);

            $table->boolean('expert_mode')->default(false);

            $table->dateTime('delete_inactive')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('rooms');
    }
};
