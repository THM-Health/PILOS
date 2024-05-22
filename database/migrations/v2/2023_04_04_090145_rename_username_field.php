<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('username', 'external_id');
            $table->string('authenticator')->default('local')->change();

            $table->dropColumn(['guid', 'domain']);

            $table->dropUnique('users_email_authenticator_unique');
            $table->unique(['email', 'authenticator', 'external_id']);
        });

        User::where('authenticator', 'users')->update(['authenticator' => 'local']);
        User::where('authenticator', 'ldap')->update(['authenticator' => 'external']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        User::where('authenticator', 'local')->update(['authenticator' => 'users']);
        User::where('authenticator', 'external')->update(['authenticator' => 'ldap']);

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('external_id', 'username');
            $table->string('authenticator')->default('users')->change();

            $table->string('guid')->unique()->nullable();
            $table->string('domain')->nullable();

            $table->dropUnique('users_email_authenticator_external_id_unique');
            $table->unique(['email', 'authenticator']);
        });
    }
};
