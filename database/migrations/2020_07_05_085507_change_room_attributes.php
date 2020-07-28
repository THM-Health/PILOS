<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ChangeRoomAttributes extends Migration
{
    public function up()
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn(['attendeePW','moderatorPW','isBreakout','sequence','publicID','securityLevel']);
            $table->string('id',11)->change();
            $table->integer('maxParticipants')->nullable()->change();
            $table->integer('duration')->nullable()->change();
            $table->boolean('lockSettingsHideUserList')->default(false);
            $table->boolean('allowGuests')->default(false);
            $table->integer('accessCode')->length(11)->nullable()->change();
            $table->integer('defaultRole')->default(\App\Enums\RoomUserRole::USER);
            $table->integer('lobby')->default(\App\Enums\RoomLobby::DISABLED);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::table('rooms', function (Blueprint $table) {
            //
        });
    }
}
