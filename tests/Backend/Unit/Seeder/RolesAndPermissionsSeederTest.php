<?php

namespace Tests\Backend\Unit\Seeder;

use App\Models\Permission;
use App\Models\Role;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;

class RolesAndPermissionsSeederTest extends TestCase
{
    use RefreshDatabase,WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
        // Initialise empty database with default roles
        $this->assertDatabaseCount('roles', 0);
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->assertDatabaseCount('roles', 2);
    }

    /**
     * Check clean installation
     */
    public function testCleanInstall()
    {
        // Check if admin role has all permissions
        $this->assertCount(Permission::all()->count(), Role::where('name', 'Superuser')->where('superuser', true)->first()->permissions);

        // Check if user role has create room permission
        $this->assertTrue(Role::where('name', 'User')->where('superuser', false)->first()->permissions->contains('name', 'rooms.create'));
    }

    /**
     * Check if user role is not created if already changed
     */
    public function testUserRoleNotCreatedIfAlreadyChanged()
    {
        // Change user role
        $userRole = Role::where('name', 'User')->first();
        $userRole->name = 'user2';
        $userRole->save();

        // Run seeder again
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->assertDatabaseCount('roles', 2);
        $this->assertDatabaseHas('roles', ['name' => 'user2']);
    }

    /**
     * Check if user role is not created if already removed
     */
    public function testUserRoleNotCreatedIfAlreadyRemoved()
    {
        // Remove user role
        Role::where('name', 'User')->first()->delete();

        // Run seeder again
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->assertDatabaseCount('roles', 1);
        $this->assertDatabaseMissing('roles', ['name' => 'User']);
    }
}
