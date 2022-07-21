<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddVersionToServersTable extends Migration
{
    public function up()
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->string('version')->nullable();
        });
    }

    public function down()
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropColumn('version');
        });
    }
}
