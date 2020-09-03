<?php

namespace Tests\Feature\api\v1;

use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * Test that get users data
     *
     * @return void
     */
    public function testGetUsers()
    {
        $user = factory(User::class)->create();

        $response = $this->actingAs($user)->get(route('api.v1.users.index'));

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
    }

    /**
     * Test that get an single user with valid user id
     */
    public function testGetUserWithValidUserId()
    {
        $user = factory(User::class)->create();

        factory(User::class)->create([
            'id'        => 32,
            'firstname' => 'Max',
            'lastname'  => 'Mustermann',
            'username'  => 'mtm',
            'email'     => 'max@mustermann.com'
        ])->save();

        $response = $this->actingAs($user)->getJson(route('api.v1.users.show', 32));

        $response->assertOk();
    }

    /**
     * Test that get an single user with invalid user id
     */
    public function testGetUserWithInvalidUserId()
    {
        $user = factory(User::class)->create();

        factory(User::class)->create([
            'id'        => 32,
            'firstname' => 'Max',
            'lastname'  => 'Mustermann',
            'username'  => 'mtm',
            'email'     => 'max@mustermann.com'
        ])->save();

        $response = $this->actingAs($user)->getJson(route('api.v1.users.show', 77));

        $response->assertStatus(404);
    }

    /**
     * Test that create an user with valid inputs
     *
     * @return void
     */
    public function testCreateUserWithValidInputs()
    {
        $user = factory(User::class)->create();

        $response = $this->actingAs($user)->postJson(route('api.v1.users.store'), [
            'firstname' => 'New',
            'lastname'  => 'User',
            'password'  => 'secret',
            'username'  => 'newuser',
            'email'     => 'new@user.com'
        ]);

        $response->assertStatus(201);
    }

    /**
     * Test that create an user with invalid inputs
     *
     * @return void
     */
    public function testCreateUserWithInvalidInputs()
    {
        $user = factory(User::class)->create();

        $response = $this->actingAs($user)->postJson(route('api.v1.users.store'), [
            'firstname' => 'Max',
            'lastname'  => 'Mustermann',
            'password'  => 'secret',
            'email'     => 'max@mustermann.com',
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
        $user = factory(User::class)->create();

        factory(User::class)->create([
           'id'        => 32,
           'firstname' => 'Max',
           'lastname'  => 'Mustermann',
            'username' => 'mtm',
            'email'    => 'max@mustermann.com'
        ])->save();

        $response = $this->actingAs($user)->deleteJson(route('api.v1.users.destroy', 32));

        $response->assertStatus(204);
    }

    /**
     * Test that delete user with an invalid user id
     *
     * @return void
     */
    public function testDeleteUserWithInvalidUserId()
    {
        $user = factory(User::class)->create();

        factory(User::class)->create([
            'id'        => 32,
            'firstname' => 'Max',
            'lastname'  => 'Mustermann',
            'username'  => 'mtm',
            'email'     => 'max@mustermann.com'
        ])->save();

        $response = $this->actingAs($user)->deleteJson(route('api.v1.users.destroy', 77));

        $response->assertStatus(404);
    }

    /**
     * Test user to delete itself when logged in
     *
     * @return void
     */
    public function testDeleteUserItself()
    {
        $user = factory(User::class)->create();

        $response = $this->actingAs($user)->deleteJson(route('api.v1.users.destroy', $user->id));

        $response->assertStatus(400);
    }

    /**
     * Test that update user with valid inputs and valid user id
     *
     * @return void
     */
    public function testUpdateUserWithValidInputsAndValidUserId()
    {
        $user = factory(User::class)->create();

        factory(User::class)->create([
            'id'        => 32,
            'firstname' => 'Max',
            'lastname'  => 'Mustermann',
            'username'  => 'mtm',
            'email'     => 'max@mustermann.com'
        ])->save();

        $response = $this->actingAs($user)->putJson(route('api.v1.users.update', 32), [
            'firstname' => 'updatemax',
            'lastname'  => 'updatemustermann',
            'username'  => 'updatemtm',
            'email'     => 'update@mail.com'
        ]);

        $response->assertStatus(202);
    }

    /**
     * Test that update user with valid inputs and invalid user id
     *
     * @return void
     */
    public function testUpdateUserWithValidInputsAndInvalidUserId()
    {
        $user = factory(User::class)->create();

        factory(User::class)->create([
            'id'        => 32,
            'firstname' => 'Max',
            'lastname'  => 'Mustermann',
            'username'  => 'mtm',
            'email'     => 'max@mustermann.com'
        ])->save();

        $response = $this->actingAs($user)->putJson(route('api.v1.users.update', 77), [
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
        $user = factory(User::class)->create();

        factory(User::class)->create([
            'id'        => 32,
            'firstname' => 'Max',
            'lastname'  => 'Mustermann',
            'username'  => 'mtm',
            'email'     => 'max@mustermann.com'
        ])->save();

        $response = $this->actingAs($user)->putJson(route('api.v1.users.update', 32), [
            'firstname' => 'updatemax',
            'lastname'  => 'updatemustermann',
            'username'  => 'updatemtm'
        ]);

        $response->assertStatus(422);
    }
}
