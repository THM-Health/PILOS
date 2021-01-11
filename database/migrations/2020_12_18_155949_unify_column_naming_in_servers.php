<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UnifyColumnNamingInServers extends Migration
{
    public function up()
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->renameColumn('baseUrl', 'base_url');
        });
    }

    public function down()
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->renameColumn('base_url', 'baseUrl');
        });
    }
}
