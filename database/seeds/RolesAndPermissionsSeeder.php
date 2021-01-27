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

        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'rooms.create' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'rooms.delete' ])->id;

        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'settings.manage' ])->id;

        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'applicationSettings.viewAny' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'applicationSettings.update' ])->id;

        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'roles.viewAny' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'roles.view' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'roles.update' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'roles.create' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'roles.delete' ])->id;

        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'users.viewAny' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'users.view' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'users.update' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'users.create' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'users.delete' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'users.updateOwnAttributes' ])->id;

        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'roomTypes.view' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'roomTypes.update' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'roomTypes.create' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'roomTypes.delete' ])->id;

        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'servers.viewAny' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'servers.view' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'servers.update' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'servers.create' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'servers.delete' ])->id;

        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'serverPools.viewAny' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'serverPools.view' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'serverPools.update' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'serverPools.create' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'serverPools.delete' ])->id;

        $adminRole = Role::where(['name' => 'admin', 'default' => true])->first();
        if ($adminRole == null) {
            $adminRole = Role::create([ 'name' => 'admin', 'default' => true, 'room_limit' => -1 ]);
        }
        $adminRole->permissions()->syncWithoutDetaching($adminPermissions);

        // Remove non existing permissions
        Permission::whereNotIn('id', $adminPermissions)->delete();

        // Setup permission inheritances
        /// Eg. If you have permission x, you also get the permissions a,b,c

        Permission::SetupIncludedPermissions('applicationSettings.update', ['applicationSettings.viewAny','settings.manage']);
        Permission::SetupIncludedPermissions('applicationSettings.viewAny', ['settings.manage']);

        Permission::SetupIncludedPermissions('roles.delete', ['roles.create','roles.update','roles.view','roles.viewAny','settings.manage']);
        Permission::SetupIncludedPermissions('roles.create', ['roles.update','roles.view','roles.viewAny','settings.manage']);
        Permission::SetupIncludedPermissions('roles.update', ['roles.view','roles.viewAny','settings.manage']);
        Permission::SetupIncludedPermissions('roles.view', ['roles.viewAny','settings.manage']);
        Permission::SetupIncludedPermissions('roles.viewAny', ['settings.manage']);

        Permission::SetupIncludedPermissions('users.delete', ['users.updateOwnAttributes','users.create','users.update','users.view','users.viewAny','roles.viewAny','settings.manage']);
        Permission::SetupIncludedPermissions('users.create', ['users.updateOwnAttributes','users.update','users.view','users.viewAny','roles.viewAny','settings.manage']);
        Permission::SetupIncludedPermissions('users.update', ['users.updateOwnAttributes','users.view','users.viewAny','roles.viewAny','settings.manage']);
        Permission::SetupIncludedPermissions('users.view', ['users.viewAny','roles.viewAny','settings.manage']);
        Permission::SetupIncludedPermissions('users.viewAny', ['settings.manage']);

        Permission::SetupIncludedPermissions('roomTypes.delete', ['roomTypes.create','roomTypes.update','roomTypes.view','serverPools.viewAny','settings.manage']);
        Permission::SetupIncludedPermissions('roomTypes.create', ['roomTypes.update','roomTypes.view','serverPools.viewAny','settings.manage']);
        Permission::SetupIncludedPermissions('roomTypes.update', ['roomTypes.view','serverPools.viewAny','settings.manage']);
        Permission::SetupIncludedPermissions('roomTypes.view', ['serverPools.viewAny','settings.manage']);

        Permission::SetupIncludedPermissions('servers.delete', ['servers.create','servers.update','servers.view','servers.viewAny','settings.manage']);
        Permission::SetupIncludedPermissions('servers.create', ['servers.update','servers.view','servers.viewAny','settings.manage']);
        Permission::SetupIncludedPermissions('servers.update', ['servers.view','servers.viewAny','settings.manage']);
        Permission::SetupIncludedPermissions('servers.view', ['servers.viewAny','settings.manage']);
        Permission::SetupIncludedPermissions('servers.viewAny', ['settings.manage']);

        Permission::SetupIncludedPermissions('serverPools.delete', ['serverPools.create','serverPools.update','serverPools.view','serverPools.viewAny','servers.viewAny', 'settings.manage']);
        Permission::SetupIncludedPermissions('serverPools.create', ['serverPools.update','serverPools.view','serverPools.viewAny','servers.viewAny', 'settings.manage']);
        Permission::SetupIncludedPermissions('serverPools.update', ['serverPools.view','serverPools.viewAny','servers.viewAny', 'settings.manage']);
        Permission::SetupIncludedPermissions('serverPools.view', ['serverPools.viewAny','servers.viewAny', 'settings.manage']);
        Permission::SetupIncludedPermissions('serverPools.viewAny', ['settings.manage']);
    }
}
