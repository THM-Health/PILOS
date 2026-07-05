<?php

// SPDX-FileCopyrightText: 2023 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

use App\Models\User;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        User::where('authenticator', 'external')->update(['authenticator' => 'ldap']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        User::where('authenticator', 'ldap')->update(['authenticator' => 'external']);
    }
};
