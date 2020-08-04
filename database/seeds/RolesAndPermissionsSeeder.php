<?php

use App\Role;
use App\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Creates the default roles and permissions for each guard and assigns to all existing
     * users of the corresponding guard a default user role if not already set.
     *
     * @return void
     */
    public function run()
    {
        // TODO
        // Permission::findOrCreate('NAME', $guard);

        // Role::findOrCreate('user', $guard, true);
        // Role::findOrCreate('admin', $guard, true);
        // $adminRole->givePermissionTo(['PERMISSION']);

        // User::doesntHave('roles')->where('authenticator', $guard)->filter(function ($user) use ($userRole) {
        //   return !$user->hasRole($userRole);
        // })->each(function ($user) use ($userRole) {
        //   $user->assignRole($userRole);
        // });
    }
}
