<?php

use App\Role;
use App\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * @var string[] Guards/Authenticators to create roles and permissions for.
     */
    private $guards = ['ldap', 'users'];

    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        foreach ($this->guards as $guard) {
            Permission::findOrCreate('manage_settings', $guard);

            // $userRole =
            Role::findOrCreate('user', $guard, true);

            $adminRole = Role::findOrCreate('admin', $guard, true);
            $adminRole->givePermissionTo([
                'manage_settings'
            ]);

// TODO: Filter user by guard and add the default role!
//            User::all()->filter(function ($user) use ($userRole) {
//                return !$user->hasRole($userRole);
//            })->each(function ($user) use ($userRole) {
//                $user->assignRole($userRole);
//            });
        }
    }
}
