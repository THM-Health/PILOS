<?php

// SPDX-FileCopyrightText: 2023 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // get value for self reset enabled if it exists with the old name
        $value = DB::table('settings')->where('key', 'password_self_reset_enabled')->first();
        if ($value != null) {
            // delete setting with the old name and add setting with the new name and the value
            DB::table('settings')->where('key', 'password_self_reset_enabled')->delete();
            DB::table('settings')->insert([
                'key' => 'password_change_allowed',
                'value' => $value->value,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
