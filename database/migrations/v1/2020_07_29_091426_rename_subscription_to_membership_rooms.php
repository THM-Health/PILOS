<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RenameSubscriptionToMembershipRooms extends Migration
{
    public function up()
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->renameColumn('allowSubscription', 'allowMembership');
        });
    }

    public function down()
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->renameColumn('allowMembership', 'allowSubscription');
        });
    }
}
