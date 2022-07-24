<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('firstname');
            $table->string('lastname');
            $table->string('username')->nullable();
            $table->string('email');
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->boolean('initial_password_set')->default(false);
            $table->string('authenticator')->default('users');
            $table->string('guid')->unique()->nullable();
            $table->string('domain')->nullable();
            $table->string('locale')->nullable();
            $table->string('timezone')->default('UTC');
            $table->string('image')->nullable();
            $table->boolean('bbb_skip_check_audio')->default(false);
            $table->rememberToken();
            $table->timestamps();

            $table->unique(['email', 'authenticator']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('users');
    }
};
