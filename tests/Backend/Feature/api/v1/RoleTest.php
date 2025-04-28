<?php

namespace Tests\Backend\Feature\api\v1;

use App\Enums\CustomStatusCodes;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;

class RoleTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public const INVALID_ID = 999999999;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_index()
    {
        $page_size = 1;
        $this->generalSettings->pagination_page_size = $page_size;
        $this->generalSettings->save();

        $user = User::factory()->create();
        $roleA = Role::factory()->create(['name' => 'Administrator', 'superuser' => true]);
        $roleB = Role::factory()->create(['name' => 'User']);
        $user->roles()->attach([$roleA->id, $roleB->id]);

        $this->getJson(route('api.v1.roles.index'))->assertUnauthorized();
        $this->actingAs($user)->getJson(route('api.v1.roles.index'))->assertStatus(403);

        $roleA->permissions()->attach(Permission::firstOrCreate(['name' => 'roles.viewAny'])->id);

        $this->getJson(route('api.v1.roles.index'))
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['name' => $roleA->name])
            ->assertJsonFragment(['superuser' => true])
            ->assertJsonFragment(['per_page' => $page_size])
            ->assertJsonFragment(['total' => 2]);

        $this->getJson(route('api.v1.roles.index').'?page=2')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['name' => $roleB->name])
            ->assertJsonFragment(['superuser' => false]);

        $this->getJson(route('api.v1.roles.index').'?page=2&sort_by=id&sort_direction=desc')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['name' => $roleA->name]);

        // Wrong data for sort gets ignored and sorting doesn't get applied
        $this->getJson(route('api.v1.roles.index').'?page=2&sort_by=test&sort_direction=foo')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['name' => $roleB->name]);

        // Test search
        $this->generalSettings->pagination_page_size = 10;
        $this->generalSettings->save();
        $this->getJson(route('api.v1.roles.index').'?name=Admin')
            ->assertSuccessful()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['name' => $roleA->name])
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.total_no_filter', 2);
    }

    public function test_create()
    {
        $user = User::factory()->create();
        $roleA = Role::factory()->create();
        $user->roles()->attach([$roleA->id]);

        $role = ['name' => $roleA->name, 'superuser' => true, 'permissions' => 'test', 'room_limit' => -2];

        $this->postJson(route('api.v1.roles.store', $role))->assertUnauthorized();
        $this->actingAs($user)->postJson(route('api.v1.roles.store', $role))->assertStatus(403);

        $permission_id = Permission::firstOrCreate(['name' => 'roles.create'])->id;
        $roleA->permissions()->attach([$permission_id]);
        $this->postJson(route('api.v1.roles.store', $role))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'permissions', 'room_limit']);

        $role['name'] = str_repeat('a', 256);
        $role['permissions'] = ['test'];
        $role['room_limit'] = 10;
        $this->postJson(route('api.v1.roles.store', $role))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'permissions.0']);

        $role['name'] = 'Test';
        $role['permissions'] = [self::INVALID_ID];
        $this->postJson(route('api.v1.roles.store', $role))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['permissions.0']);

        $role['name'] = 'Test';
        $role['permissions'] = [$permission_id];
        $this->postJson(route('api.v1.roles.store', $role))
            ->assertSuccessful();
        $this->assertDatabaseCount('roles', 2);
        $this->assertDatabaseCount('permission_role', 2);
        $roleDB = Role::where(['name' => 'Test'])->first();

        // check if superuser cannot be set, even if it is sent
        $this->assertFalse($roleDB->superuser);
        $this->assertEquals(10, $roleDB->room_limit);
    }

    /**
     * Test if admins can create roles with permissions that have been restricted
     * by system admins that only superusers should have and no other role
     */
    public function test_create_restricted_permissions()
    {

        config(['permissions.restrictions' => ['servers.create', 'serverPools.*']]);

        $user = User::factory()->create();
        $roleA = Role::factory()->create();
        $user->roles()->attach([$roleA->id]);

        $createRolesPermission = Permission::firstOrCreate(['name' => 'roles.create']);
        $createServersPermission = Permission::firstOrCreate(['name' => 'servers.create']);
        $createServerPoolPermission = Permission::firstOrCreate(['name' => 'serverPools.create']);
        $roleA->permissions()->attach([$createRolesPermission, $createServersPermission]);

        $role = [
            'name' => 'Test',
            'superuser' => false,
            'permissions' => [$createRolesPermission->id, $createServersPermission->id],
            'room_limit' => 1,
        ];

        $this->actingAs($user)->postJson(route('api.v1.roles.store', $role))
            ->assertSuccessful();

        // Check if the role has been created and only the allowed permission has been attached
        $roleDB = Role::where(['name' => 'Test'])->first();
        $this->assertNotNull($roleDB);
        $this->assertCount(1, $roleDB->permissions);
        $this->assertEquals($createRolesPermission->id, $roleDB->permissions->first()->id);
    }

    public function test_update()
    {
        $user = User::factory()->create();
        $superuserRole = Role::factory()->create(['superuser' => true, 'room_limit' => -1]);
        $role = Role::factory()->create(['room_limit' => 20]);
        $user->roles()->attach([$superuserRole->id]);

        $new_permission = Permission::firstOrCreate(['name' => 'users.viewAny'])->id;

        $permission_ids = [
            Permission::firstOrCreate(['name' => 'admin.view'])->id,
            Permission::firstOrCreate(['name' => 'roles.viewAny'])->id,
            Permission::firstOrCreate(['name' => 'roles.view'])->id,
            Permission::firstOrCreate(['name' => 'roles.update'])->id,
            Permission::firstOrCreate(['name' => 'users.create'])->id,
        ];

        $changes = [
            'name' => 'NewSuperuser',
            'permissions' => [$permission_ids[0], $permission_ids[1], $permission_ids[2], $permission_ids[3], $new_permission],
            'superuser' => false,
            'room_limit' => 10,
        ];

        // Test update superuser role unauthorized
        $this->putJson(route('api.v1.roles.update', ['role' => $superuserRole]), $changes)
            ->assertUnauthorized();

        // Test update superuser role authorized, but without permissions
        $this->actingAs($user)->putJson(route('api.v1.roles.update', ['role' => $superuserRole]), $changes)
            ->assertStatus(403);

        // Test update superuser role with permissions
        $superuserRole->permissions()->attach($permission_ids);

        $this->putJson(route('api.v1.roles.update', ['role' => $superuserRole]), $changes)
            ->assertStatus(CustomStatusCodes::STALE_MODEL->value);

        $changes['updated_at'] = Carbon::now();

        $this->putJson(route('api.v1.roles.update', ['role' => $superuserRole]), $changes)
            ->assertSuccessful();

        $superuserRole->refresh();

        // Changing name of superuser role is allowed
        $this->assertEquals('NewSuperuser', $superuserRole->name);

        // Changing permissions and room_limit cannot be changed for superuser
        $this->assertEquals(-1, $superuserRole->room_limit);
        $this->assertNotEquals($changes['permissions'], $superuserRole->permissions()->pluck('permissions.id')->toArray());

        // Changing superuser to false is not possible
        $this->assertTrue($superuserRole->superuser);

        // Test editing with empty permissions
        $role->permissions()->attach($permission_ids);
        $changes = [
            'name' => 'NewUser',
            'permissions' => [],
            'superuser' => true,
            'room_limit' => -1,
            'updated_at' => $role->updated_at,
        ];

        $this->putJson(route('api.v1.roles.update', ['role' => $role]), $changes)
            ->assertSuccessful();
        $role->refresh();

        // Check if changes are applied
        $this->assertEquals('NewUser', $role->name);
        $this->assertEquals(0, $role->permissions()->count());
        $this->assertEquals(-1, $role->room_limit);

        // Changing superuser to true is not possible
        $this->assertFalse($role->superuser);

        // Test invalid / missing
        $changes = [
            'name' => $superuserRole->name,
            'superuser' => false,
            'room_limit' => -10,
            'updated_at' => $role->updated_at,
        ];
        $this->putJson(route('api.v1.roles.update', ['role' => $role]), $changes)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['permissions', 'name', 'room_limit']);
    }

    public function test_update_permission_lost()
    {
        $user = User::factory()->create();
        $roleA = Role::factory()->create();
        $user->roles()->attach([$roleA->id]);

        $new_permission = Permission::firstOrCreate(['name' => 'users.viewAny'])->id;

        $permission_ids = [
            Permission::firstOrCreate(['name' => 'admin.view'])->id,
            Permission::firstOrCreate(['name' => 'roles.viewAny'])->id,
            Permission::firstOrCreate(['name' => 'roles.view'])->id,
            Permission::firstOrCreate(['name' => 'roles.update'])->id,
            Permission::firstOrCreate(['name' => 'users.create'])->id,
        ];

        $roleA->permissions()->attach($permission_ids);

        $this->actingAs($user)->putJson(route('api.v1.roles.update', ['role' => $roleA]), [
            'name' => $roleA->name,
            'permissions' => [$permission_ids[0], $permission_ids[1], $new_permission],
            'updated_at' => $roleA->updated_at,
        ])->assertStatus(CustomStatusCodes::ROLE_UPDATE_PERMISSION_LOST->value);

        $roleA->unsetRelation('permissions');
        $this->assertEquals($permission_ids, $roleA->permissions()->pluck('permissions.id')->toArray());
    }

    public function test_update_restricted_permissions()
    {
        $user = User::factory()->create();
        $roleA = Role::factory()->create();
        $user->roles()->attach([$roleA->id]);

        config(['permissions.restrictions' => ['servers.create', 'serverPools.*']]);

        $permission_ids = [
            Permission::firstOrCreate(['name' => 'admin.view'])->id,
            Permission::firstOrCreate(['name' => 'roles.viewAny'])->id,
            Permission::firstOrCreate(['name' => 'roles.view'])->id,
            Permission::firstOrCreate(['name' => 'roles.update'])->id,
            Permission::firstOrCreate(['name' => 'users.create'])->id,
        ];

        $roleA->permissions()->attach($permission_ids);

        $createServersPermission = Permission::firstOrCreate(['name' => 'servers.create']);
        $createServerPoolsPermission = Permission::firstOrCreate(['name' => 'serverPools.create']);

        $roleA->permissions()->attach([$createServerPoolsPermission->id]);

        $role = [
            'name' => 'Test',
            'superuser' => false,
            'permissions' => [...$permission_ids, $createServerPoolsPermission->id, $createServersPermission->id],
            'room_limit' => 1,
            'updated_at' => now(),
        ];

        $this->actingAs($user)->putJson(route('api.v1.roles.update', ['role' => $roleA]), $role)
            ->assertSuccessful();

        // Check if the role has been updated and only the allowed permission has been attached
        // and the restricted permissions that were already attached have been removed
        $roleA->refresh();
        $this->assertCount(5, $roleA->permissions);
    }

    public function test_show()
    {
        $user = User::factory()->create();
        $roleA = Role::factory()->create(['superuser' => true]);
        $roleB = Role::factory()->create();
        $user->roles()->attach([$roleA->id, $roleB->id]);

        $this->getJson(route('api.v1.roles.show', ['role' => $roleA]))->assertUnauthorized();
        $this->actingAs($user)->getJson(route('api.v1.roles.show', ['role' => $roleA]))->assertStatus(403);

        $permission = Permission::firstOrCreate(['name' => 'roles.view']);
        $roleA->permissions()->attach($permission->id);
        $roleB->permissions()->attach($permission->id);

        $this->actingAs($user)->getJson(route('api.v1.roles.show', ['role' => self::INVALID_ID]))
            ->assertNotFound();
        $this->getJson(route('api.v1.roles.show', ['role' => $roleA]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'name' => $roleA->name,
                'superuser' => true,
                'permissions' => [['name' => $permission->name, 'id' => $permission->id]],
            ]);

        $this->getJson(route('api.v1.roles.show', ['role' => $roleB]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'name' => $roleB->name,
                'superuser' => false,
                'permissions' => [['name' => $permission->name, 'id' => $permission->id]],
            ]);
    }

    public function test_delete()
    {
        $user = User::factory()->create();
        $role = Role::factory()->create();
        $superuserRole = Role::factory()->create(['superuser' => true]);
        $user->roles()->attach([$role->id, $superuserRole->id]);

        $this->deleteJson(route('api.v1.roles.destroy', ['role' => $role]))->assertUnauthorized();
        $this->actingAs($user)->deleteJson(route('api.v1.roles.destroy', ['role' => $role]))->assertStatus(403);

        $permission = Permission::firstOrCreate(['name' => 'roles.delete']);
        $superuserRole->permissions()->attach($permission->id);
        $role->permissions()->attach($permission->id);

        $this->deleteJson(route('api.v1.roles.destroy', ['role' => self::INVALID_ID]))->assertNotFound();

        // check if superuser role cannot be deleted
        $this->deleteJson(route('api.v1.roles.destroy', ['role' => $superuserRole]))->assertStatus(403);

        // check if role with linked users cannot be deleted
        $this->deleteJson(route('api.v1.roles.destroy', ['role' => $role]))
            ->assertStatus(CustomStatusCodes::ROLE_DELETE_LINKED_USERS->value)
            ->assertJsonFragment([
                'error' => CustomStatusCodes::ROLE_DELETE_LINKED_USERS,
                'message' => __('app.errors.role_delete_linked_users'),
            ]);

        $role->users()->detach([$user->id]);
        $this->deleteJson(route('api.v1.roles.destroy', ['role' => $role]))->assertSuccessful();
    }
}
