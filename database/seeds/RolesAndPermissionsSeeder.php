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
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'roles.create' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'roles.update' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'roles.delete' ])->id;

        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'users.viewAny' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'users.view' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'users.create' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'users.update' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'users.delete' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'users.updateOwnAttributes' ])->id;

        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'roomTypes.view' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'roomTypes.create' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'roomTypes.update' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'roomTypes.delete' ])->id;

        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'servers.viewAny' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'servers.view' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'servers.update' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'servers.create' ])->id;
        $adminPermissions[] = Permission::firstOrCreate([ 'name' => 'servers.delete' ])->id;

        $adminRole = Role::where(['name' => 'admin', 'default' => true])->first();
        if ($adminRole == null) {
            $adminRole = Role::create([ 'name' => 'admin', 'default' => true, 'room_limit' => -1 ]);
        }
        $adminRole->permissions()->syncWithoutDetaching($adminPermissions);

        // Remove non existing permissions
        Permission::whereNotIn('id', $adminPermissions)->delete();

        // Setup permission inheritances
        /// Eg. If you have permission x, you also get the permissions a,b,c

        Permission::SetupPermissionInheritances('applicationSettings.update', ['applicationSettings.viewAny','settings.manage']);
        Permission::SetupPermissionInheritances('applicationSettings.viewAny', ['settings.manage']);

        Permission::SetupPermissionInheritances('roles.delete', ['roles.create','roles.update','roles.view','roles.viewAny','settings.manage']);
        Permission::SetupPermissionInheritances('roles.create', ['roles.update','roles.view','roles.viewAny','settings.manage']);
        Permission::SetupPermissionInheritances('roles.update', ['roles.view','roles.viewAny','settings.manage']);
        Permission::SetupPermissionInheritances('roles.view', ['roles.viewAny','settings.manage']);
        Permission::SetupPermissionInheritances('roles.viewAny', ['settings.manage']);

        Permission::SetupPermissionInheritances('users.delete', ['users.updateOwnAttributes','users.create','users.update','users.view','users.viewAny','roles.viewAny','settings.manage']);
        Permission::SetupPermissionInheritances('users.create', ['users.updateOwnAttributes','users.update','users.view','users.viewAny','roles.viewAny','settings.manage']);
        Permission::SetupPermissionInheritances('users.update', ['users.updateOwnAttributes','users.view','users.viewAny','roles.viewAny','settings.manage']);
        Permission::SetupPermissionInheritances('users.view', ['users.viewAny','roles.viewAny','settings.manage']);
        Permission::SetupPermissionInheritances('users.viewAny', ['settings.manage']);

        Permission::SetupPermissionInheritances('roomTypes.delete', ['roomTypes.create','roomTypes.update','roomTypes.view','settings.manage']);
        Permission::SetupPermissionInheritances('roomTypes.create', ['roomTypes.update','roomTypes.view','settings.manage']);
        Permission::SetupPermissionInheritances('roomTypes.update', ['roomTypes.view','settings.manage']);
        Permission::SetupPermissionInheritances('roomTypes.view', ['settings.manage']);

        Permission::SetupPermissionInheritances('servers.delete', ['servers.create','servers.update','servers.view','servers.viewAny','settings.manage']);
        Permission::SetupPermissionInheritances('servers.create', ['servers.update','servers.view','servers.viewAny','settings.manage']);
        Permission::SetupPermissionInheritances('servers.update', ['servers.view','servers.viewAny','settings.manage']);
        Permission::SetupPermissionInheritances('servers.view', ['servers.viewAny','settings.manage']);
        Permission::SetupPermissionInheritances('servers.viewAny', ['settings.manage']);
    }
}
