<?php

use App\Role;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    private $guards = ['api', 'api_users'];

    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        foreach ($this->guards as $guard) {
            Role::findOrCreate('user', $guard, true);
            Role::findOrCreate('admin', $guard, true);
        }
    }
}
