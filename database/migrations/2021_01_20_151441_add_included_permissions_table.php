<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIncludedPermissionsTable extends Migration
{
    public function up()
    {
        Schema::create('included_permissions', function (Blueprint $table) {
            $table->unsignedBigInteger('permission_id');
            $table->foreign('permission_id')->references('id')->on('permissions')->onDelete('cascade');
            $table->unsignedBigInteger('included_permission_id');
            $table->foreign('included_permission_id')->references('id')->on('permissions')->onDelete('cascade');
            $table->unique(['permission_id', 'included_permission_id'], 'unique_included_permission');
        });
    }

    public function down()
    {
        Schema::dropIfExists('included_permissions');
    }
}
