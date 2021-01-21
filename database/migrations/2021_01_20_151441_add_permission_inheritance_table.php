<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPermissionInheritanceTable extends Migration
{
    public function up()
    {
        Schema::create('permission_inheritances', function (Blueprint $table) {
            $table->unsignedBigInteger('permission_id');
            $table->foreign('permission_id')->references('id')->on('permissions')->onDelete('cascade');
            $table->unsignedBigInteger('inheritance_permission_id');
            $table->foreign('inheritance_permission_id')->references('id')->on('permissions')->onDelete('cascade');
            $table->unique(['permission_id', 'inheritance_permission_id'],'unique_permission_inheritance');
        });
    }

    public function down()
    {
        Schema::dropIfExists('permission_inheritances');
    }
}
