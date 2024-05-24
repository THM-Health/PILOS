<?php

use App\Enums\ServerStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('servers', function (Blueprint $table) {
            $table->id();
            $table->text('name');
            $table->text('description')->nullable();
            $table->text('base_url');
            $table->text('secret');
            $table->string('version')->nullable();
            $table->smallInteger('strength')->default(1);
            $table->smallInteger('status')->default(ServerStatus::DISABLED);
            $table->integer('participant_count')->nullable();
            $table->integer('listener_count')->nullable();
            $table->integer('voice_participant_count')->nullable();
            $table->integer('video_count')->nullable();
            $table->integer('meeting_count')->nullable();
            $table->integer('load')->nullable();
            $table->integer('error_count')->default(0);
            $table->integer('recover_count')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('servers');
    }
};
