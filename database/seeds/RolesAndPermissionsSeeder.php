<?php

use App\Role;
use App\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        Permission::findOrCreate('manage_settings');

        $userRole = Role::findOrCreate('user', null, true);


        $adminRole = Role::findOrCreate('admin', null, true);
        $adminRole->givePermissionTo([
            'manage_settings'
        ]);

        User::all()->filter(function ($user) use ($userRole) {
            return !$user->hasRole($userRole);
        })->each(function ($user) use ($userRole) {
            $user->assignRole($userRole);
        });
    }
}
