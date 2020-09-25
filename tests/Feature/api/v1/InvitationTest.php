<?php

namespace Tests\Feature\api\v1;

use App\Invitation;
use App\Permission;
use App\Role;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class InvitationTest extends TestCase
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
        $this->permission = factory(Permission::class)->create(['name'=>'invitations.create']);
        $this->role->permissions()->attach($this->permission);
        $this->user->roles()->attach($this->role);
    }

    /**
     * Test that check whether an invitation token for register is valid
     *
     * @return void
     */
    public function testCheckInvitationTokenWithValidInvitationToken()
    {
        $invitation = factory(Invitation::class)->create();

        $response = $this->getJson(route('api.v1.checkInvitationToken', [
            'invitation_token' => $invitation->invitation_token
        ]));

        $response->assertStatus(200);
    }

    /**
     * Test that check whether an invitation token for register is valid with invalid token
     *
     * @return void
     */
    public function testCheckInvitationTokenWithInvalidInvitationToken()
    {
        // Prepare invitation token expiration config to 30 minutes from now
        config(['settings.defaults.invitation_token_expiration' => 30]);

        $invitation = factory(Invitation::class)->create();

        // Invitation token not exist test
        $response = $this->getJson(route('api.v1.checkInvitationToken', [
            'invitation_token' => 'invalidtoken'
        ]));

        $response->assertStatus(401);

        // Expire the token by setting created_at back to 60 minutes from now
        $invitation->created_at = Carbon::now()->subMinutes(60)->toDateTimeString();
        $invitation->save();

        $response = $this->getJson(route('api.v1.checkInvitationToken', [
            'invitation_token' => $invitation->invitation_token
        ]));

        $response->assertStatus(401);
    }

    /**
     * Test that create an invitation for register with valid inputs
     *
     * @return void
     */
    public function testCreateInvitationWithValidInputs()
    {
        $emails = ['maxmuster@local.com'];

        $response = $this->actingAs($this->user)->postJson(route('api.v1.invitations.store'), [
            'email' => $emails
        ]);

        $response->assertStatus(201);

        $emails = ['mustermannmax@local.com'];

        // Detach the created user roles
        $this->user->roles()->detach(1);

        // Test unauthorized
        $response = $this->actingAs($this->user)->postJson(route('api.v1.invitations.store'), [
            'email' => $emails
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test that create an invitation for register with valid inputs and multiple emails
     *
     * @return void
     */
    public function testCreateInvitationWithValidInputsAndMultipleEmails()
    {
        $emails = ['maxmuster@local.com', 'mustermax@local.com', 'maxmustermann@local.com'];

        $response = $this->actingAs($this->user)->postJson(route('api.v1.invitations.store'), [
            'email' => $emails
        ]);

        $response->assertStatus(201);
    }

    /**
     * Test that create an invitation for register with valid inputs
     *
     * @return void
     */
    public function testCreateInvitationWithInvalidInputs()
    {
        $emails = ['test'];

        $response = $this->actingAs($this->user)->postJson(route('api.v1.invitations.store'), [
            'email' => $emails
        ]);

        $response->assertStatus(422);
    }

    /**
     * Test that create an invitation for register with emails which already existed in invitations table
     *
     * @return void
     */
    public function testCreateInvitationWithEmailsExistedInInvitationTable()
    {
        $invitation = factory(Invitation::class)->create([
            'email' => 'maxmuster@local.com'
        ]);

        $emails = ['maxmuster@local.com'];

        $response = $this->actingAs($this->user)->postJson(route('api.v1.invitations.store'), [
            'email' => $emails
        ]);

        $response->assertStatus(201);
    }
}
