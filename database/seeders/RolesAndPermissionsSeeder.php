<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
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
        // Check if roles already exists (not a clean installation)
        $freshInstall = Role::all()->count() == 0;

        // List of all permissions
        $permissions = [
            Permission::firstOrCreate(['name' => 'rooms.create'])->id,
            Permission::firstOrCreate(['name' => 'rooms.viewAll'])->id,
            Permission::firstOrCreate(['name' => 'rooms.manage'])->id,

            Permission::firstOrCreate(['name' => 'meetings.viewAny'])->id,

            Permission::firstOrCreate(['name' => 'admin.view'])->id,

            Permission::firstOrCreate(['name' => 'settings.viewAny'])->id,
            Permission::firstOrCreate(['name' => 'settings.update'])->id,

            Permission::firstOrCreate(['name' => 'roles.viewAny'])->id,
            Permission::firstOrCreate(['name' => 'roles.view'])->id,
            Permission::firstOrCreate(['name' => 'roles.update'])->id,
            Permission::firstOrCreate(['name' => 'roles.create'])->id,
            Permission::firstOrCreate(['name' => 'roles.delete'])->id,

            Permission::firstOrCreate(['name' => 'users.viewAny'])->id,
            Permission::firstOrCreate(['name' => 'users.view'])->id,
            Permission::firstOrCreate(['name' => 'users.update'])->id,
            Permission::firstOrCreate(['name' => 'users.create'])->id,
            Permission::firstOrCreate(['name' => 'users.delete'])->id,
            Permission::firstOrCreate(['name' => 'users.updateOwnAttributes'])->id,

            Permission::firstOrCreate(['name' => 'roomTypes.view'])->id,
            Permission::firstOrCreate(['name' => 'roomTypes.update'])->id,
            Permission::firstOrCreate(['name' => 'roomTypes.create'])->id,
            Permission::firstOrCreate(['name' => 'roomTypes.delete'])->id,

            Permission::firstOrCreate(['name' => 'servers.viewAny'])->id,
            Permission::firstOrCreate(['name' => 'servers.view'])->id,
            Permission::firstOrCreate(['name' => 'servers.update'])->id,
            Permission::firstOrCreate(['name' => 'servers.create'])->id,
            Permission::firstOrCreate(['name' => 'servers.delete'])->id,

            Permission::firstOrCreate(['name' => 'serverPools.viewAny'])->id,
            Permission::firstOrCreate(['name' => 'serverPools.view'])->id,
            Permission::firstOrCreate(['name' => 'serverPools.update'])->id,
            Permission::firstOrCreate(['name' => 'serverPools.create'])->id,
            Permission::firstOrCreate(['name' => 'serverPools.delete'])->id,

            Permission::firstOrCreate(['name' => 'system.monitor'])->id,
        ];

        // Setup superuser role and give all permissions
        $superuserRole = Role::where(['superuser' => true])->first();
        if ($superuserRole == null) {
            $superuserRole = Role::create(['name' => 'Superuser', 'superuser' => true, 'room_limit' => -1]);
        }
        $superuserRole->permissions()->syncWithoutDetaching($permissions);

        // Setup default user role and permissions on fresh installation
        if ($freshInstall) {
            $userRole = Role::create(['name' => 'User']);

            $userDefaultPermissions = [];
            $userDefaultPermissions[] = Permission::firstOrCreate(['name' => 'rooms.create'])->id;
            $userRole->permissions()->syncWithoutDetaching($userDefaultPermissions);
        }

        // Remove non-existing permissions
        Permission::whereNotIn('id', $permissions)->delete();

        // Setup permission inheritances
        /// e.g. If you have permission x, you also get the permissions a,b,c
        Permission::setIncludedPermissions('rooms.manage', ['rooms.create', 'rooms.viewAll']);

        Permission::setIncludedPermissions('meetings.viewAny', ['rooms.viewAll']);

        Permission::setIncludedPermissions('settings.update', ['settings.viewAny', 'admin.view']);
        Permission::setIncludedPermissions('settings.viewAny', ['admin.view']);

        Permission::setIncludedPermissions('roles.delete', ['roles.create', 'roles.update', 'roles.view', 'roles.viewAny', 'admin.view']);
        Permission::setIncludedPermissions('roles.create', ['roles.update', 'roles.view', 'roles.viewAny', 'admin.view']);
        Permission::setIncludedPermissions('roles.update', ['roles.view', 'roles.viewAny', 'admin.view']);
        Permission::setIncludedPermissions('roles.view', ['roles.viewAny', 'admin.view']);
        Permission::setIncludedPermissions('roles.viewAny', ['admin.view']);

        Permission::setIncludedPermissions('users.delete', ['users.updateOwnAttributes', 'users.create', 'users.update', 'users.view', 'users.viewAny', 'roles.viewAny', 'admin.view']);
        Permission::setIncludedPermissions('users.create', ['users.updateOwnAttributes', 'users.update', 'users.view', 'users.viewAny', 'roles.viewAny', 'admin.view']);
        Permission::setIncludedPermissions('users.update', ['users.updateOwnAttributes', 'users.view', 'users.viewAny', 'roles.viewAny', 'admin.view']);
        Permission::setIncludedPermissions('users.view', ['users.viewAny', 'roles.viewAny', 'admin.view']);
        Permission::setIncludedPermissions('users.viewAny', ['roles.viewAny', 'admin.view']);

        Permission::setIncludedPermissions('roomTypes.delete', ['roomTypes.create', 'roomTypes.update', 'roomTypes.view', 'serverPools.viewAny', 'admin.view', 'roles.viewAny']);
        Permission::setIncludedPermissions('roomTypes.create', ['roomTypes.update', 'roomTypes.view', 'serverPools.viewAny', 'admin.view', 'roles.viewAny']);
        Permission::setIncludedPermissions('roomTypes.update', ['roomTypes.view', 'serverPools.viewAny', 'admin.view', 'roles.viewAny']);
        Permission::setIncludedPermissions('roomTypes.view', ['admin.view']);

        Permission::setIncludedPermissions('servers.delete', ['servers.create', 'servers.update', 'servers.view', 'servers.viewAny', 'admin.view']);
        Permission::setIncludedPermissions('servers.create', ['servers.update', 'servers.view', 'servers.viewAny', 'admin.view']);
        Permission::setIncludedPermissions('servers.update', ['servers.view', 'servers.viewAny', 'admin.view']);
        Permission::setIncludedPermissions('servers.view', ['servers.viewAny', 'admin.view']);
        Permission::setIncludedPermissions('servers.viewAny', ['admin.view']);

        Permission::setIncludedPermissions('serverPools.delete', ['serverPools.create', 'serverPools.update', 'serverPools.view', 'serverPools.viewAny', 'servers.viewAny', 'admin.view']);
        Permission::setIncludedPermissions('serverPools.create', ['serverPools.update', 'serverPools.view', 'serverPools.viewAny', 'servers.viewAny', 'admin.view']);
        Permission::setIncludedPermissions('serverPools.update', ['serverPools.view', 'serverPools.viewAny', 'servers.viewAny', 'admin.view']);
        Permission::setIncludedPermissions('serverPools.view', ['serverPools.viewAny', 'admin.view']);
        Permission::setIncludedPermissions('serverPools.viewAny', ['admin.view']);
    }
}
