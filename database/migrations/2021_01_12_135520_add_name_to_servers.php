<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddNameToServers extends Migration
{
    public function up()
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->renameColumn('description', 'name');
        });
        Schema::table('servers', function (Blueprint $table) {
            $table->text('description')->nullable();
        });
    }

    public function down()
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropColumn('description');
        });
        Schema::table('servers', function (Blueprint $table) {
            $table->renameColumn('name', 'description');
        });
    }
}
