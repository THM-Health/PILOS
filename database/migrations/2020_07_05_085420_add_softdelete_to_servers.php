<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSoftdeleteToServers extends Migration
{
    public function up()
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down()
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
}
