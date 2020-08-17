<?php

use App\Role;
use App\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Creates the default roles and permissions and assigns to all existing
     * users a default user role if not already set.
     *
     * @return void
     */
    public function run()
    {
        $userRole = Role::firstOrCreate([ 'name' => 'user', 'default' => true ]);
        Role::firstOrCreate([ 'name' => 'admin', 'default' => true ]);

        $userRole->users()->syncWithoutDetaching(User::pluck('id'));
    }
}
