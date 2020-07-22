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
     * TODO: Change after pull request #21 was merged!
     */
    private $guards = ['api', 'api_users'];

    /**
     * Creates the default roles and permissions for each guard and assigns to all existing
     * users of the corresponding guard a default user role if not already set.
     *
     * @return void
     */
    public function run()
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        foreach ($this->guards as $guard) {
            // Permission::findOrCreate('NAME', $guard);

            Role::findOrCreate('user', $guard, true);
            Role::findOrCreate('admin', $guard, true);
            // $adminRole->givePermissionTo(['PERMISSION']);

            // TODO(#21): Filter user by guard and add the default role!
            // User::doesntHave('roles')->where('authenticator', $guard)->filter(function ($user) use ($userRole) {
            //   return !$user->hasRole($userRole);
            // })->each(function ($user) use ($userRole) {
            //   $user->assignRole($userRole);
            // });
        }
    }
}
