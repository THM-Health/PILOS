<?php

namespace Tests\Feature\api\v1;

use App\Permission;
use App\Role;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use LdapRecord\Laravel\Testing\DirectoryEmulator;
use LdapRecord\Models\OpenLDAP\User as LdapUser;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function testIndex()
    {
        $page_size = 5;
        setting(['pagination_page_size' => $page_size]);

        // Create Users + Ldap User with roles
        $users  = factory(User::class, 10)->create([
            'firstname' => 'Darth',
            'lastname'  => 'Vader'
        ]);
        $user   = factory(User::class)->create([
            'firstname' => 'John',
            'lastname'  => 'Doe'
        ]);

        DirectoryEmulator::setup('default');
        LdapUser::create([
            'givenName'              => 'Jane',
            'sn'                     => 'Doe',
            'cn'                     => $this->faker->name,
            'mail'                   => $this->faker->unique()->safeEmail,
            'uid'                    => $this->faker->unique()->userName,
            'entryuuid'              => $this->faker->uuid,
        ]);
        $this->artisan('ldap:import', [
            'provider' => 'ldap',
            '--no-interaction'
        ])->assertExitCode(0);

        $this->assertDatabaseCount('users', 12);

        $ldapUser = User::where(['authenticator' => 'ldap'])->first();

        // Unauthenticated user
        $this->getJson(route('api.v1.users.index'))->assertUnauthorized();

        // User without permission
        $this->actingAs($user)->getJson(route('api.v1.users.index'))->assertForbidden();

        // Authenticated user with permission
        $role = factory(Role::class)->create(['default' => true]);

        $permission = Permission::firstOrCreate([ 'name' => 'users.viewAny' ]);
        $role->permissions()->attach($permission->id);

        $role->users()->attach([$ldapUser->id, $user->id]);

        $response = $this->actingAs($user)->getJson(route('api.v1.users.index'))
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['firstname' => $users[0]->firstname])
            ->assertJsonFragment(['firstname' => $users[4]->firstname])
            ->assertJsonFragment(['per_page' => $page_size])
            ->assertJsonFragment(['total' => 12])
            ->assertJsonStructure([
                'meta',
                'links',
                'data' => [
                    '*' => [
                        'id',
                        'authenticator',
                        'email',
                        'firstname',
                        'lastname',
                        'user_locale',
                        'updated_at',
                        'room_limit',
                        'model_name'
                    ]
                ]
            ]);

        foreach ($response['data'] as $item) {
            $this->assertArrayNotHasKey('roles', $item);
        }

        // Pagination
        $this->getJson(route('api.v1.users.index') . '?page=2')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['firstname' => $users[5]->firstname]);

        // Sorting
        $this->getJson(route('api.v1.users.index') . '?sort_by=firstname&sort_direction=desc')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['firstname' => $user->firstname])
            ->assertJsonFragment(['firstname' => $ldapUser->firstname]);

        // Sorting wrong direction and field
        $this->getJson(route('api.v1.users.index') . '?sort_by=username&sort_direction=desc')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonMissingExact(['firstname' => $user->firstname])
            ->assertJsonMissingExact(['firstname' => $ldapUser->firstname]);

        $this->getJson(route('api.v1.users.index') . '?sort_by=firstname')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonMissingExact(['firstname' => $user->firstname])
            ->assertJsonMissingExact(['firstname' => $ldapUser->firstname]);

        $this->getJson(route('api.v1.users.index') . '?sort_direction=desc')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonMissingExact(['firstname' => $user->firstname])
            ->assertJsonMissingExact(['firstname' => $ldapUser->firstname]);

        $this->getJson(route('api.v1.users.index') . '?sort_by=foo&sort_direction=desc')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonMissingExact(['firstname' => $user->firstname])
            ->assertJsonMissingExact(['firstname' => $ldapUser->firstname]);

        $this->getJson(route('api.v1.users.index') . '?sort_by=firstname&sort_direction=foo')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonMissingExact(['firstname' => $user->firstname])
            ->assertJsonMissingExact(['firstname' => $ldapUser->firstname]);

        // Filtering by name
        $this->getJson(route('api.v1.users.index') . '?name=J%20Doe')
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['firstname' => $user->firstname])
            ->assertJsonFragment(['firstname' => $ldapUser->firstname]);
    }

    public function testCreate()
    {
        $user = factory(User::class)->create();

        $request = [];

        // Unauthenticated user
        $this->postJson(route('api.v1.users.store', $request))->assertUnauthorized();

        // User without permission
        $this->actingAs($user)->postJson(route('api.v1.users.store', $request))->assertForbidden();

        // Invalid request
        $role = factory(Role::class)->create(['default' => true]);

        $permission = Permission::firstOrCreate([ 'name' => 'users.create' ]);
        $role->permissions()->attach($permission->id);

        $role->users()->attach([$user->id]);

        // Empty request
        $this->actingAs($user)->postJson(route('api.v1.users.store', $request))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['firstname', 'password', 'email', 'lastname', 'user_locale', 'roles', 'username']);

        $request = [
            'firstname'   => str_repeat('a', 256),
            'lastname'    => str_repeat('a', 256),
            'user_locale' => 451,
            'username'    => str_repeat('a', 256),
            'email'       => 'test',
            'password'    => 'aT2wqw_2',
            'roles'       => [99]
        ];

        $this->postJson(route('api.v1.users.store', $request))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['firstname', 'password', 'email', 'lastname', 'user_locale', 'roles.0', 'username']);

        config([
            'app.available_locales' => ['fr', 'es', 'be', 'de', 'en', 'ru'],
        ]);

        $request = [
            'firstname'             => $this->faker->firstName,
            'lastname'              => $this->faker->lastName,
            'user_locale'           => 'hr',
            'email'                 => $user->email,
            'username'              => $user->username,
            'password'              => 'aT2wqw_2',
            'password_confirmation' => 'aT2wqw_2',
            'roles'                 => [$role->id],
            'authenticator'         => 'ldap'
        ];

        $this->postJson(route('api.v1.users.store', $request))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'user_locale']);

        $request['email']       = $this->faker->email;
        $request['user_locale'] = 'de';
        $request['username']    = $this->faker->userName;

        $this->postJson(route('api.v1.users.store', $request))
            ->assertSuccessful()
            ->assertJsonFragment([
                'firstname'     => $request['firstname'],
                'lastname'      => $request['lastname'],
                'user_locale'   => $request['user_locale'],
                'email'         => $request['email'],
                'username'      => $request['username'],
                'roles'         => [[ 'id' => $role->id, 'name' => $role->name, 'automatic' => false ]],
                'authenticator' => 'users'
            ]);
    }

    public function testUpdate()
    {
        config([
            'app.available_locales' => ['fr', 'es', 'be', 'de', 'en', 'ru'],
        ]);

        $newRole = factory(Role::class)->create(['default' => true]);

        $user = factory(User::class)->create();

        $changes = [
            'firstname'   => $this->faker->firstName,
            'lastname'    => $this->faker->lastName,
            'email'       => $user->email,
            'roles'       => [$newRole->id],
            'username'    => $user->username,
            'user_locale' => 'de'
        ];

        $userToUpdate = factory(User::class)->create();

        DirectoryEmulator::setup('default');
        LdapUser::create([
            'givenName'              => 'Jane',
            'sn'                     => 'Doe',
            'cn'                     => $this->faker->name,
            'mail'                   => $this->faker->unique()->safeEmail,
            'uid'                    => $this->faker->unique()->userName,
            'entryuuid'              => $this->faker->uuid,
        ]);
        $this->artisan('ldap:import', [
            'provider' => 'ldap',
            '--no-interaction'
        ])->assertExitCode(0);

        $ldapUserToUpdate = User::where(['authenticator' => 'ldap'])->first();

        // Unauthenticated user
        $this->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertUnauthorized();

        // User without permission other user
        $this->actingAs($user)->putJson(route('api.v1.users.update', ['user' => $userToUpdate]), $changes)
            ->assertForbidden();

        // Own user
        $role = factory(Role::class)->create(['default' => true]);

        $permission = Permission::firstOrCreate([ 'name' => 'users.delete' ]);
        $role->permissions()->attach($permission->id);

        $role->users()->attach([$user->id]);

        $this->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertStatus(422)
            ->assertJsonValidationErrors('updated_at');

        $changes['updated_at'] = strftime(now());
        $changes['password']   = 'Test2_34T';

        $this->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertStatus(422)
            ->assertJsonValidationErrors('password');

        $changes['password_confirmation'] = 'Test2_34T';

        $this->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertSuccessful();

        $user->refresh();
        $user->unsetRelation('roles');
        $this->assertEquals($role->id, $user->roles->first()->id);

        $permission = Permission::firstOrCreate([ 'name' => 'users.update' ]);
        $role->permissions()->attach($permission->id);

        // Not existing user
        $this->putJson(route('api.v1.users.update', ['user' => 1337]), $changes)
            ->assertNotFound();

        // Existing user invalid
        $this->putJson(route('api.v1.users.update', ['user' => $userToUpdate]), $changes)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['username', 'email']);

        // Existing user valid normal user
        $this->putJson(route('api.v1.users.update', ['user' => $userToUpdate]), [
            'firstname'   => $this->faker->firstName,
            'lastname'    => $this->faker->lastName,
            'email'       => $userToUpdate->email,
            'roles'       => [$newRole->id],
            'username'    => $userToUpdate->username,
            'user_locale' => 'de',
            'updated_at'  => $userToUpdate->updated_at
        ])
        ->assertSuccessful()
        ->assertJsonFragment(['roles' => [['id' => $newRole->id, 'name' => $newRole->name, 'automatic' => false]]]);

        // Existing user valid ldap user
        $ldapUserToUpdate->roles()->sync([$role->id => ['automatic' => true]]);
        $this->putJson(route('api.v1.users.update', ['user' => $ldapUserToUpdate]), [
            'firstname'     => $this->faker->firstName,
            'lastname'      => $this->faker->lastName,
            'email'         => $this->faker->email,
            'roles'         => [$newRole->id],
            'username'      => $this->faker->userName,
            'updated_at'    => $ldapUserToUpdate->updated_at,
            'user_locale'   => 'de',
            'authenticator' => 'users'
        ])
        ->assertSuccessful()
        ->assertJsonFragment([
            'roles'         => [['id' => $role->id, 'name' => $role->name, 'automatic' => true], ['id' => $newRole->id, 'name' => $newRole->name, 'automatic' => false]],
            'user_locale'   => 'de',
            'firstname'     => $ldapUserToUpdate->firstname,
            'lastname'      => $ldapUserToUpdate->lastname,
            'email'         => $ldapUserToUpdate->email,
            'username'      => $ldapUserToUpdate->username,
            'authenticator' => 'ldap'
        ]);
    }

    public function testShow()
    {
        $user = factory(User::class)->create();

        DirectoryEmulator::setup('default');
        LdapUser::create([
            'givenName'              => $this->faker->firstName,
            'sn'                     => $this->faker->lastName,
            'cn'                     => $this->faker->name,
            'mail'                   => $this->faker->unique()->safeEmail,
            'uid'                    => $this->faker->unique()->userName,
            'entryuuid'              => $this->faker->uuid,
        ]);
        $this->artisan('ldap:import', [
            'provider' => 'ldap',
            '--no-interaction'
        ])->assertExitCode(0);

        $this->assertDatabaseCount('users', 2);

        $ldapUser = User::where(['authenticator' => 'ldap'])->first();

        // Unauthenticated user
        $this->getJson(route('api.v1.users.show', ['user' => $ldapUser]))->assertUnauthorized();

        // User without permission other user
        $this->actingAs($user)->getJson(route('api.v1.users.show', ['user' => $ldapUser]))
            ->assertForbidden();

        // User without permission own user
        $this->actingAs($user)->getJson(route('api.v1.users.show', ['user' => $user]))
            ->assertSuccessful()
            ->assertJsonFragment([
                'firstname'     => $user->firstname,
                'lastname'      => $user->lastname,
                'authenticator' => 'users'
            ]);

        // Not existing user
        $role = factory(Role::class)->create(['default' => true]);

        $permission = Permission::firstOrCreate([ 'name' => 'users.view' ]);
        $role->permissions()->attach($permission->id);

        $role->users()->attach([$ldapUser->id, $user->id]);

        $this->actingAs($user)->getJson(route('api.v1.users.show', ['user' => 1337]))
            ->assertNotFound();

        // Existing user
        $this->actingAs($user)->getJson(route('api.v1.users.show', ['user' => $ldapUser]))
            ->assertSuccessful()
            ->assertJsonFragment([
                'firstname'     => $ldapUser->firstname,
                'lastname'      => $ldapUser->lastname,
                'authenticator' => 'ldap',
                'roles'         => [['id' => $role->id, 'name' => $role->name, 'automatic' => false]]
            ]);
    }

    public function testDelete()
    {
        $userToDelete = factory(User::class)->create();
        $user         = factory(User::class)->create();

        DirectoryEmulator::setup('default');
        LdapUser::create([
            'givenName'              => $this->faker->firstName,
            'sn'                     => $this->faker->lastName,
            'cn'                     => $this->faker->name,
            'mail'                   => $this->faker->unique()->safeEmail,
            'uid'                    => $this->faker->unique()->userName,
            'entryuuid'              => $this->faker->uuid,
        ]);
        $this->artisan('ldap:import', [
            'provider' => 'ldap',
            '--no-interaction'
        ])->assertExitCode(0);

        $this->assertDatabaseCount('users', 3);

        $ldapUser = User::where(['authenticator' => 'ldap'])->first();

        // Unauthenticated user
        $this->deleteJson(route('api.v1.users.destroy', ['user' => $userToDelete]))->assertUnauthorized();

        // User without permission
        $this->actingAs($user)->deleteJson(route('api.v1.users.destroy', ['user' => $userToDelete]))
            ->assertForbidden();

        // Not existing model
        $this->actingAs($user)->deleteJson(route('api.v1.users.destroy', ['user' => 1337]))->assertNotFound();

        // User own model
        $this->actingAs($user)->deleteJson(route('api.v1.users.destroy', ['user' => $user]))
            ->assertForbidden();

        // User other model
        $role = factory(Role::class)->create(['default' => true]);
        $role->users()->attach([$userToDelete->id, $user->id]);

        $permission = Permission::firstOrCreate([ 'name' => 'users.delete' ]);
        $role->permissions()->attach($permission->id);

        $this->actingAs($user)->deleteJson(route('api.v1.users.destroy', ['user' => $userToDelete]))
            ->assertNoContent();

        $this->actingAs($user)->deleteJson(route('api.v1.users.destroy', ['user' => $ldapUser]))
            ->assertNoContent();

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('role_user', 1);
    }
}
