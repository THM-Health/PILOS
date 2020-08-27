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
        $userRole = Role::firstOrCreate([ 'name' => 'user', 'default' => true ]);
        Role::firstOrCreate([ 'name' => 'admin', 'default' => true ]);
        $roomsCreate = Permission::firstOrCreate([ 'name' => 'rooms.create']);
        $roomsCreate->roles()->syncWithoutDetaching(Role::pluck('id'));
        $userRole->users()->syncWithoutDetaching(User::pluck('id'));
    }
}
