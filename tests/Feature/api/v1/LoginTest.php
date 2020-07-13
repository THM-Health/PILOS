<?php

namespace Tests\Feature\api\v1;

use App\User;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * Tests that a correct response gets returned when trying to login with invalid credentials.
     *
     * @return void
     */
    public function testLoginWrongCredentials()
    {
        $user = factory(User::class)->create([
            'password' => Hash::make('bar')
        ]);
        $response = $this->from(config('app.url'))->postJson(route('api.v1.login'), [
            'email'    => $user->email,
            'password' => 'foo'
        ]);
        $response->assertStatus(422);
        $this->assertFalse($this->isAuthenticated());
    }

    /**
     * Tests a successful authentication with correct user credentials for database users.
     *
     * @return void
     */
    public function testLoginSuccessUserProvider()
    {
        $user           = factory(User::class)->make();
        $password       = $user->password;
        $user->password = Hash::make($password);
        $user->save();
        $response = $this->from(config('app.url'))->postJson(route('api.v1.login'), [
            'email'    => $user->email,
            'password' => $password
        ]);
        $response->assertNoContent();
        $this->assertAuthenticated();
    }

    /**
     * Test empty response for current user if the user isn't authenticated.
     *
     * @return void
     */
    public function testUnauthenticatedCurrentUser()
    {
        $response = $this->getJson(route('api.v1.currentUser'));
        $response->assertOk();
        $response->assertJson([]);
    }

    /**
     * Test correct response for current user if the user is authenticated.
     *
     * @return void
     */
    public function testAuthenticatedCurrentUser()
    {
        $user     = factory(User::class)->make();
        $response = $this->actingAs($user)->from(config('app.url'))->getJson(route('api.v1.currentUser'));
        $response->assertOk();
        $response->assertJsonFragment([
            'firstname' => $user->firstname,
            'lastname'  => $user->lastname
        ]);
    }

    /**
     * Test that logout works as expected if the user is authenticated.
     *
     * @return void
     */
    public function testLogoutAuthenticated()
    {
        $user     = factory(User::class)->make();
        $response = $this->actingAs($user)->from(config('app.url'))->postJson(route('api.v1.logout'));
        $response->assertNoContent();
        $this->assertFalse($this->isAuthenticated());
    }

    /**
     * Test correct error message on calling logout as unauthenticated user.
     *
     * @return void
     */
    public function testLogoutUnauthenticated()
    {
        $response = $this->postJson(route('api.v1.logout'));
        $response->assertUnauthorized();
        $response->assertJson([
            'message' => 'Unauthenticated.'
        ]);
    }
}
