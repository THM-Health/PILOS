<?php

namespace Tests\Feature\api\v1;

use App\Invitation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class RegisterTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * Setup resources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Set the registration to open registration
        config(['settings.defaults.open_registration' => true]);
    }

    /**
     * Test register invitation method with valid invitation token and valid inputs
     *
     * @return void
     */
    public function testRegisterInvitationWithValidInvitationTokenAndValidInputs()
    {
        // Set the registration to invitation only
        config(['settings.defaults.open_registration' => false]);

        $invitation = factory(Invitation::class)->create([
            'email' => 'max.mustermann@local.com'
        ]);

        $response = $this->postJson(route('api.v1.register'), [
            'firstname'             => 'New',
            'lastname'              => 'User',
            'password'              => 'N3wUser.',
            'password_confirmation' => 'N3wUser.',
            'username'              => 'newuser',
            'email'                 => 'newuser@local.com',
            'invitation_token'      => $invitation->invitation_token
        ]);

        $response->assertStatus(201);
    }

    /**
     * Test register invitation method with invalid invitation token and valid inputs
     *
     * @return void
     */
    public function testRegisterInvitationWithInvalidInvitationTokenAndValidInputs()
    {
        // Set the registration to invitation only
        config(['settings.defaults.open_registration' => false]);

        $invitation = factory(Invitation::class)->create([
            'email' => 'max.mustermann@local.com'
        ]);

        $response = $this->postJson(route('api.v1.register'), [
            'firstname'             => 'New',
            'lastname'              => 'User',
            'password'              => 'N3wUser.',
            'password_confirmation' => 'N3wUser.',
            'username'              => 'newuser',
            'email'                 => $invitation->email,
            'invitation_token'      => 'invalidtoken'
        ]);

        $response->assertStatus(400);
    }

    /**
     * Test register invitation method with used invitation token
     *
     * @return void
     */
    public function testRegisterInvitationWithUsedInvitationToken()
    {
        // Set the registration to invitation only
        config(['settings.defaults.open_registration' => false]);

        // Info used invitation_token has registered_at value not null
        $invitation = factory(Invitation::class)->create([
            'email'         => 'max.mustermann@local.com',
            'registered_at' => $this->faker->date(now())
        ]);

        $response = $this->postJson(route('api.v1.register'), [
            'firstname'             => 'New',
            'lastname'              => 'User',
            'password'              => 'N3wUser.',
            'password_confirmation' => 'N3wUser.',
            'username'              => 'newuser',
            'email'                 => $invitation->email,
            'invitation_token'      => $invitation->invitation_token
        ]);

        $response->assertStatus(400);
    }

    /**
     * Test open registration method with valid inputs
     *
     * @return void
     */
    public function testRegisterWithValidInputs()
    {
        $response = $this->postJson(route('api.v1.register'), [
            'firstname'             => 'New',
            'lastname'              => 'User',
            'password'              => 'N3wUser.',
            'password_confirmation' => 'N3wUser.',
            'username'              => 'newuser',
            'email'                 => 'newuser@local.com'
        ]);

        $response->assertStatus(201);
    }

    /**
     * Test open registration method with invalid inputs
     *
     * @return void
     */
    public function testRegisterWithInvalidInputs()
    {
        $response = $this->postJson(route('api.v1.register'), [
            'firstname'             => 'New',
            'lastname'              => 'User',
            'password'              => 'N3wUser.',
            'username'              => 'newuser',
            'email'                 => 'newuser@local.com'
        ]);

        $response->assertStatus(422);
    }
}
