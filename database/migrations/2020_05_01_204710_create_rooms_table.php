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
            $table->id();
            $table->string('name',256);
            $table->string('attendeePW',64);
            $table->string('moderatorPW',64);
            $table->string('welcome',5000)->nullable();
            $table->integer('maxParticipants')->default(0);
            $table->integer('duration')->default(0);
            $table->boolean('isBreakout')->default(false);
            $table->unsignedBigInteger('parentMeetingID')->nullable();
            $table->foreign('parentMeetingID')->references('id')->on('rooms')->onDelete('cascade');
            $table->integer('sequence')->default(0);
            $table->boolean('webcamsOnlyForModerator')->default(false);
            $table->boolean('muteOnStart')->default(false);
            $table->boolean('lockSettingsDisableCam')->default(false);
            $table->boolean('lockSettingsDisableMic')->default(false);
            $table->boolean('lockSettingsDisablePrivateChat')->default(false);
            $table->boolean('lockSettingsDisablePublicChat')->default(false);
            $table->boolean('lockSettingsDisableNote')->default(false);
            $table->boolean('lockSettingsLockOnJoin')->default(true);
            $table->string('guestPolicy')->nullable();
            $table->boolean('allowSubscription')->default(false);
            $table->boolean('everyoneCanStart')->default(false);
            $table->boolean('everyoneModerator')->default(false);
            $table->string('publicID',9);
            $table->integer('accessCode')->length(9)->nullable();
            $table->integer('securityLevel')->default(0);
            $table->unsignedBigInteger('preferedServer')->nullable();
            $table->foreign('preferedServer')->references('id')->on('servers')->onDelete('set null');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
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
