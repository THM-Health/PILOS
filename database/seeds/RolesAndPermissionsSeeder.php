<?php

use App\Permission;
use App\Role;
use App\User;
use Illuminate\Database\Seeder;


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
        $adminPermissions = [];
        $userPermissions = [];

        $adminPermissions[] = $userPermissions[] = Permission::firstOrCreate([ 'name' => 'rooms.create' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'rooms.delete' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'settings.manage' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'roles.viewAny' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'users.viewAny' ])->id;

        $userRole = Role::firstOrCreate([ 'name' => 'user', 'default' => true ]);
        $adminRole = Role::firstOrCreate([ 'name' => 'admin', 'default' => true ]);

        $userRole->permissions()->syncWithoutDetaching($userPermissions);
        $adminRole->permissions()->syncWithoutDetaching($adminPermissions);
        $userRole->users()->syncWithoutDetaching(User::has('roles', '=', 0)->pluck('id'));
    }
}
