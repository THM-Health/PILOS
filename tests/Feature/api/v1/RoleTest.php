<?php

namespace Tests\Feature\api\v1;

use App\Enums\CustomStatusCodes;
use App\Permission;
use App\Role;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class RoleTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function testIndex()
    {
        $page_size = 1;
        setting(['pagination_page_size' => $page_size]);

        $user       = factory(User::class)->create();
        $roleA      = factory(Role::class)->create();
        $roleB      = factory(Role::class)->create();
        $user->roles()->attach([$roleA->id, $roleB->id]);

        $this->getJson(route('api.v1.roles.index'))->assertStatus(401);
        $this->actingAs($user)->getJson(route('api.v1.roles.index'))->assertStatus(403);

        $roleA->permissions()->attach(Permission::firstOrCreate([ 'name' => 'roles.viewAny' ])->id);

        $response = $this->getJson(route('api.v1.roles.index'));
        $response->assertStatus(200);

        $response->assertJsonCount($page_size, 'data');
        $response->assertJsonFragment(['name' => $roleA->name]);
        $response->assertJsonFragment(['per_page' => $page_size]);
        $response->assertJsonFragment(['total' => 2]);
    }

    public function testCreate()
    {
        $user       = factory(User::class)->create();
        $roleA      = factory(Role::class)->create();
        $user->roles()->attach([$roleA->id]);

        $role = ['name' => $roleA->name, 'default' => true, 'permissions' => 'test', 'room_limit' => -2];

        $this->postJson(route('api.v1.roles.store', $role))->assertUnauthorized();
        $this->actingAs($user)->postJson(route('api.v1.roles.store', $role))->assertStatus(403);

        $permission_id = Permission::firstOrCreate([ 'name' => 'roles.create' ])->id;
        $roleA->permissions()->attach([$permission_id]);
        $this->postJson(route('api.v1.roles.store', $role))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'permissions', 'room_limit']);

        $role['name']        = str_repeat('a', 256);
        $role['permissions'] = ['test'];
        $role['room_limit']  = 10;
        $this->postJson(route('api.v1.roles.store', $role))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'permissions.0']);

        $role['name']        = '**';
        $role['permissions'] = [99];
        $this->postJson(route('api.v1.roles.store', $role))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'permissions.0']);

        $role['name']        = 'Test';
        $role['permissions'] = [$permission_id];
        $this->postJson(route('api.v1.roles.store', $role))
            ->assertSuccessful();
        $this->assertDatabaseCount('roles', 2);
        $this->assertDatabaseCount('permission_role', 2);
        $roleDB = Role::where(['name' => 'Test'])->first();
        $this->assertFalse($roleDB->default);
        $this->assertEquals(10, $roleDB->room_limit);
    }

    public function testUpdate()
    {
        $user       = factory(User::class)->create();
        $roleA      = factory(Role::class)->create(['default' => true, 'room_limit' => 20]);
        $user->roles()->attach([$roleA->id]);

        $new_permission = Permission::firstOrCreate([ 'name' => 'users.viewAny' ])->id;

        $permission_ids = [
            Permission::firstOrCreate([ 'name' => 'roles.update' ])->id,
            Permission::firstOrCreate([ 'name' => 'roles.viewAny' ])->id,
            Permission::firstOrCreate([ 'name' => 'settings.manage' ])->id,
            Permission::firstOrCreate([ 'name' => 'users.create' ])->id
        ];

        $changes = [
            'name'        => 'Test',
            'permissions' => [$permission_ids[0], $permission_ids[1], $permission_ids[2], $new_permission],
            'default'     => true,
            'room_limit'  => null
        ];

        $this->putJson(route('api.v1.roles.update', ['role'=>$roleA]), $changes)
            ->assertUnauthorized();

        $this->actingAs($user)->putJson(route('api.v1.roles.update', ['role'=>$roleA]), $changes)
            ->assertStatus(403);

        $roleA->permissions()->attach($permission_ids);

        $this->putJson(route('api.v1.roles.update', ['role'=>$roleA]), $changes)
            ->assertStatus(403);

        $roleA->default = false;
        $roleA->save();

        $this->putJson(route('api.v1.roles.update', ['role'=>$roleA]), $changes)
            ->assertStatus(422)
            ->assertJsonValidationErrors('updated_at');

        $changes['updated_at'] = now();

        $this->putJson(route('api.v1.roles.update', ['role'=>$roleA]), $changes)
            ->assertSuccessful();

        $roleA->refresh();
        $this->assertEquals($changes['name'], $roleA->name);
        $this->assertEquals(false, $roleA->default);
        $this->assertEquals(null, $roleA->room_limit);
        $this->assertEquals($changes['permissions'], $roleA->permissions()->pluck('permissions.id')->toArray());
    }

    public function testUpdatePermissionLost()
    {
        $user       = factory(User::class)->create();
        $roleA      = factory(Role::class)->create();
        $user->roles()->attach([$roleA->id]);

        $new_permission = Permission::firstOrCreate([ 'name' => 'users.viewAny' ])->id;

        $permission_ids = [
            Permission::firstOrCreate([ 'name' => 'roles.update' ])->id,
            Permission::firstOrCreate([ 'name' => 'roles.viewAny' ])->id,
            Permission::firstOrCreate([ 'name' => 'settings.manage' ])->id
        ];

        $roleA->permissions()->attach($permission_ids);

        $this->actingAs($user)->putJson(route('api.v1.roles.update', ['role'=>$roleA]), [
            'name'        => $roleA->name,
            'permissions' => [$permission_ids[0], $permission_ids[1], $new_permission],
            'updated_at'  => $roleA->updated_at
        ])->dump()->assertStatus(CustomStatusCodes::ROLE_UPDATE_PERMISSION_LOST);

        $roleA->unsetRelation('permissions');
        $this->assertEquals($permission_ids, $roleA->permissions()->pluck('permissions.id')->toArray());
    }

    public function testShow()
    {
        $user       = factory(User::class)->create();
        $roleA      = factory(Role::class)->create();
        $roleB      = factory(Role::class)->create();
        $user->roles()->attach([$roleA->id, $roleB->id]);

        $this->getJson(route('api.v1.roles.show', ['role' => $roleA]))->assertStatus(401);
        $this->actingAs($user)->getJson(route('api.v1.roles.show', ['role' => $roleA]))->assertStatus(403);

        $permission = Permission::firstOrCreate([ 'name' => 'roles.view' ]);
        $roleA->permissions()->attach($permission->id);

        $this->actingAs($user)->getJson(route('api.v1.roles.show', ['role' => 99]))
            ->assertNotFound();
        $this->getJson(route('api.v1.roles.show', ['role' => $roleA]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'name'        => $roleA->name,
                'permissions' => [['name' => $permission->name, 'id' => $permission->id]]
            ]);
    }

    public function testDelete()
    {
        $user       = factory(User::class)->create();
        $roleA      = factory(Role::class)->create(['default' => true]);
        $roleB      = factory(Role::class)->create();
        $user->roles()->attach([$roleA->id, $roleB->id]);

        $this->deleteJson(route('api.v1.roles.destroy', ['role' => $roleA]))->assertUnauthorized();
        $this->actingAs($user)->deleteJson(route('api.v1.roles.destroy', ['role' => $roleA]))->assertStatus(403);

        $permission = Permission::firstOrCreate([ 'name' => 'roles.delete' ]);
        $roleA->permissions()->attach($permission->id);
        $roleB->permissions()->attach($permission->id);

        $this->deleteJson(route('api.v1.roles.destroy', ['role' => 99]))->assertNotFound();
        $this->deleteJson(route('api.v1.roles.destroy', ['role' => $roleA]))->assertStatus(403);
        $this->deleteJson(route('api.v1.roles.destroy', ['role' => $roleB]))
            ->assertStatus(CustomStatusCodes::ROLE_DELETE_LINKED_USERS)
            ->assertJsonFragment([
                'error'   => CustomStatusCodes::ROLE_DELETE_LINKED_USERS,
                'message' => trans('app.errors.role_delete_linked_users')
            ]);

        $roleB->users()->detach([$user->id]);
        $this->deleteJson(route('api.v1.roles.destroy', ['role' => $roleB]))->assertSuccessful();
    }
}
