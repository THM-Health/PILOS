<?php

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
