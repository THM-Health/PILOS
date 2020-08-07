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
                    'updatedAt'
                ]
            ]
        ]);
    }

    /**
     * Test that create a user with valid inputs
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
     * Test that create a user with invalid inputs
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
}
