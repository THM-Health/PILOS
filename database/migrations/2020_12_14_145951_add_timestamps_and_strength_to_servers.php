<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddTimestampsAndStrengthToServers extends Migration
{
    public function up()
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->smallInteger('strength');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropColumn('strength');
            $table->dropTimestamps();
        });
    }
}
