<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRoomsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->string('id',11);
            $table->primary('id');
            $table->string('name',256);
            $table->string('welcome',5000)->nullable();
            $table->integer('maxParticipants')->default(0)->nullable();
            $table->integer('duration')->default(0)->nullable();
            $table->boolean('webcamsOnlyForModerator')->default(false);
            $table->boolean('muteOnStart')->default(false);
            $table->boolean('lockSettingsDisableCam')->default(false);
            $table->boolean('lockSettingsDisableMic')->default(false);
            $table->boolean('lockSettingsDisablePrivateChat')->default(false);
            $table->boolean('lockSettingsDisablePublicChat')->default(false);
            $table->boolean('lockSettingsDisableNote')->default(false);
            $table->boolean('lockSettingsLockOnJoin')->default(true);
            $table->boolean('lockSettingsHideUserList')->default(false);
            $table->boolean('allowGuests')->default(false);
            $table->integer('defaultRole')->default(\App\Enums\RoomUserRole::USER);
            $table->integer('lobby')->default(\App\Enums\RoomLobby::DISABLED);
            $table->boolean('allowSubscription')->default(false);
            $table->boolean('everyoneCanStart')->default(false);
            $table->boolean('everyoneModerator')->default(false);
            $table->integer('accessCode')->length(11)->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unsignedBigInteger('room_type_id');
            $table->foreign('room_type_id')->references('id')->on('room_types')->onDelete('restrict');
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
}
