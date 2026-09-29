<?php

declare(strict_types=1);

namespace Tests\Backend\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Backend\TestCase;

class PulseTest extends TestCase
{
    use RefreshDatabase;

    public function test_route_disabled(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $role = Role::factory()->create();
        $role->permissions()->attach(Permission::where('name', 'system.monitor')->first());
        $user->roles()->attach($role);

        config(['pulse.enabled' => false]);

        $this->actingAs($user)
            ->get('/'.config('pulse.path'))
            ->assertNotFound();
    }

    public function test_route_enabled(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $role = Role::factory()->create();
        $role->permissions()->attach(Permission::where('name', 'system.monitor')->first());
        $user->roles()->attach($role);

        config(['pulse.enabled' => true]);

        $this->actingAs($user)
            ->get('/'.config('pulse.path'))
            ->assertSuccessful();
    }
}
