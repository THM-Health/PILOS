<?php

namespace Tests\Feature\api\v1;

use App\Permission;
use App\Role;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;
    protected $role;
    protected $permission;

    /**
     * Setup resources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->user = factory(User::class)->create();

        // Authorize user
        $this->role       = factory(Role::class)->create(['name' => 'admin']);

        $this->permission = factory(Permission::class)->create(['name'=>'users.viewAny']);
        $this->role->permissions()->attach($this->permission);

        $this->permission = factory(Permission::class)->create(['name'=>'users.create']);
        $this->role->permissions()->attach($this->permission);

        $this->permission = factory(Permission::class)->create(['name'=>'users.update']);
        $this->role->permissions()->attach($this->permission);

        $this->permission = factory(Permission::class)->create(['name'=>'users.delete']);
        $this->role->permissions()->attach($this->permission);

        $this->user->roles()->attach($this->role);
    }

    /**
     * Test that get users data
     *
     * @return void
     */
    public function testGetUsers()
    {
        $response = $this->actingAs($this->user)->getJson(route('api.v1.users.index'));

        $response->assertOk();
        $response->assertJsonStructure([
            'meta',
            'links',
            'data' => [
                '*' => [
                    'id',
                    'authenticator',
                    'email',
                    'firstname',
                    'guid',
                    'lastname',
                    'locale',
                    'username',
                    'createdAt',
                    'updatedAt',
                    'modelName'
                ]
            ]
        ]);

        // Detach the created user roles
        $this->user->roles()->detach(1);

        // Test Forbidden
        $response = $this->actingAs($this->user)->getJson(route('api.v1.users.index'));
        $response->assertForbidden();

        // Logout
        Auth::logout();

        // Test unauthorized
        $response = $this->getJson(route('api.v1.users.index'));
        $response->assertUnauthorized();
    }

    /**
     * Test that get an single user with valid user id
     */
    public function testGetUserWithValidUserId()
    {
        factory(User::class)->create([
            'id'        => 32,
            'firstname' => 'Max',
            'lastname'  => 'Mustermann',
            'username'  => 'mtm',
            'email'     => 'max@mustermann.com'
        ])->save();

        $response = $this->actingAs($this->user)->getJson(route('api.v1.users.show', 32));

        $response->assertOk();

        // Detach the created user roles
        $this->user->roles()->detach(1);

        // Test Forbidden
        $response = $this->actingAs($this->user)->getJson(route('api.v1.users.show', 32));
        $response->assertForbidden();

        // Logout
        Auth::logout();

        // Test unauthorized
        $response = $this->getJson(route('api.v1.users.show', 32));
        $response->assertUnauthorized();
    }

    /**
     * Test that get an single user with invalid user id
     */
    public function testGetUserWithInvalidUserId()
    {
        factory(User::class)->create([
            'id'        => 32,
            'firstname' => 'Max',
            'lastname'  => 'Mustermann',
            'username'  => 'mtm',
            'email'     => 'max@mustermann.com'
        ])->save();

        $response = $this->actingAs($this->user)->getJson(route('api.v1.users.show', 77));

        $response->assertStatus(404);
    }

    /**
     * Test that create an user with valid inputs
     *
     * @return void
     */
    public function testCreateUserWithValidInputs()
    {
        $response = $this->actingAs($this->user)->postJson(route('api.v1.users.store'), [
            'firstname'              => 'New',
            'lastname'               => 'User',
            'password'               => 'N3wUser.',
            'password_confirmation'  => 'N3wUser.',
            'username'               => 'newuser',
            'email'                  => 'new@user.com'
        ]);

        $response->assertStatus(201);

        // Detach the created user roles
        $this->user->roles()->detach(1);

        // Test Forbidden
        $response = $this->actingAs($this->user)->postJson(route('api.v1.users.store'), [
            'firstname'              => 'New',
            'lastname'               => 'User',
            'password'               => 'N3wUser.',
            'password_confirmation'  => 'N3wUser.',
            'username'               => 'newuser',
            'email'                  => 'new@user.com'
        ]);
        $response->assertForbidden();

        // Logout
        Auth::logout();

        // Test unauthorized
        $response = $this->postJson(route('api.v1.users.store'), [
            'firstname'              => 'New',
            'lastname'               => 'User',
            'password'               => 'N3wUser.',
            'password_confirmation'  => 'N3wUser.',
            'username'               => 'newuser',
            'email'                  => 'new@user.com'
        ]);
        $response->assertUnauthorized();
    }

    /**
     * Test that create an user with invalid inputs
     *
     * @return void
     */
    public function testCreateUserWithInvalidInputs()
    {
        // False password format test
        $response = $this->actingAs($this->user)->postJson(route('api.v1.users.store'), [
            'firstname'              => 'Max',
            'lastname'               => 'Mustermann',
            'password'               => 'falsepassword',
            'password_confirmation'  => 'falsepassword',
            'email'                  => 'max@mustermann.com',
        ]);

        $response->assertStatus(422);

        // Password confirmation not same test
        $response = $this->actingAs($this->user)->postJson(route('api.v1.users.store'), [
            'firstname'              => 'Max',
            'lastname'               => 'Mustermann',
            'password'               => 'N3wUser.',
            'password_confirmation'  => 'N3wUser,',
            'email'                  => 'max@mustermann.com',
        ]);

        $response->assertStatus(422);
    }

    /**
     * Test that delete an user with a valid user id
     *
     * @return void
     */
    public function testDeleteUserWithValidUserId()
    {
        factory(User::class)->create([
           'id'        => 32,
           'firstname' => 'Max',
           'lastname'  => 'Mustermann',
            'username' => 'mtm',
            'email'    => 'max@mustermann.com'
        ])->save();

        $response = $this->actingAs($this->user)->deleteJson(route('api.v1.users.destroy', 32));

        $response->assertStatus(204);

        //recreate user
        factory(User::class)->create([
            'id'        => 32,
            'firstname' => 'Max',
            'lastname'  => 'Mustermann',
            'username'  => 'mtm',
            'email'     => 'max@mustermann.com'
        ])->save();

        // Detach the created user roles
        $this->user->roles()->detach(1);

        // Test Forbidden
        $response = $this->actingAs($this->user)->deleteJson(route('api.v1.users.destroy', 32));
        $response->assertForbidden();

        // Logout
        Auth::logout();

        // Test unauthorized
        $response = $this->deleteJson(route('api.v1.users.destroy', 32));
        $response->assertUnauthorized();
    }

    /**
     * Test that delete user with an invalid user id
     *
     * @return void
     */
    public function testDeleteUserWithInvalidUserId()
    {
        factory(User::class)->create([
            'id'        => 32,
            'firstname' => 'Max',
            'lastname'  => 'Mustermann',
            'username'  => 'mtm',
            'email'     => 'max@mustermann.com'
        ])->save();

        $response = $this->actingAs($this->user)->deleteJson(route('api.v1.users.destroy', 77));

        $response->assertStatus(404);
    }

    /**
     * Test user to delete itself when logged in
     *
     * @return void
     */
    public function testDeleteUserItself()
    {
        $response = $this->actingAs($this->user)->deleteJson(route('api.v1.users.destroy', $this->user->id));

        $response->assertStatus(403);
    }

    /**
     * Test that update user with valid inputs and valid user id
     *
     * @return void
     */
    public function testUpdateUserWithValidInputsAndValidUserId()
    {
        factory(User::class)->create([
            'id'        => 32,
            'firstname' => 'Max',
            'lastname'  => 'Mustermann',
            'username'  => 'mtm',
            'email'     => 'max@mustermann.com'
        ])->save();

        $response = $this->actingAs($this->user)->putJson(route('api.v1.users.update', 32), [
            'firstname' => 'updatemax',
            'lastname'  => 'updatemustermann',
            'username'  => 'updatemtm',
            'email'     => 'update@mail.com'
        ]);

        $response->assertStatus(202);

        // Detach the created user roles
        $this->user->roles()->detach(1);

        // Test Forbidden
        $response = $this->actingAs($this->user)->putJson(route('api.v1.users.update', 32), [
            'firstname' => 'updatemax',
            'lastname'  => 'updatemustermann',
            'username'  => 'updatemtm',
            'email'     => 'update@mail.com'
        ]);
        $response->assertForbidden();

        // Logout
        Auth::logout();

        // Test unauthorized
        $response = $this->putJson(route('api.v1.users.update', 32), [
            'firstname' => 'updatemax',
            'lastname'  => 'updatemustermann',
            'username'  => 'updatemtm',
            'email'     => 'update@mail.com'
        ]);
        $response->assertUnauthorized();
    }

    /**
     * Test that update user with valid inputs and invalid user id
     *
     * @return void
     */
    public function testUpdateUserWithValidInputsAndInvalidUserId()
    {
        factory(User::class)->create([
            'id'        => 32,
            'firstname' => 'Max',
            'lastname'  => 'Mustermann',
            'username'  => 'mtm',
            'email'     => 'max@mustermann.com'
        ])->save();

        $response = $this->actingAs($this->user)->putJson(route('api.v1.users.update', 77), [
            'firstname' => 'updatemax',
            'lastname'  => 'updatemustermann',
            'username'  => 'updatemtm',
            'email'     => 'update@mail.com'
        ]);

        $response->assertStatus(404);
    }

    /**
     * Test that update user with invalid inputs and valid user id
     *
     * @return void
     */
    public function testUpdateUserWithInvalidInputsAndValidUserId()
    {
        factory(User::class)->create([
            'id'        => 32,
            'firstname' => 'Max',
            'lastname'  => 'Mustermann',
            'username'  => 'mtm',
            'email'     => 'max@mustermann.com'
        ])->save();

        $response = $this->actingAs($this->user)->putJson(route('api.v1.users.update', 32), [
            'firstname' => 'updatemax',
            'lastname'  => 'updatemustermann',
            'username'  => 'updatemtm'
        ]);

        $response->assertStatus(422);
    }
}
