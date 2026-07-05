<?php

// SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

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
        Schema::create('recording_formats', function (Blueprint $table) {
            $table->id();
            $table->string('recording_id');
            $table->foreign('recording_id')->references('id')->on('recordings')->onDelete('cascade');
            $table->string('format');
            $table->string('url');
            $table->boolean('disabled')->default(false);
            $table->timestamps();
            $table->unique(['recording_id', 'format']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('recording_formats');
    }
};
