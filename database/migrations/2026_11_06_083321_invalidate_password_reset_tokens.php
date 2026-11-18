<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Invalidates all outstanding password reset tokens, as queued password reset and welcome
     * notifications previously stored these tokens unencrypted in the queue and failed jobs
     */
    public function up(): void
    {
        DB::table('password_resets')->delete();
    }
};
