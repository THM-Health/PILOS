<?php

namespace Tests\Feature\api\v1;

use App\Invitation;
use App\Permission;
use App\Role;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
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
        $invitation = factory(Invitation::class)->create();

        $response = $this->getJson(route('api.v1.checkInvitationToken', [
            'invitation_token' => 'invalidtoken'
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
        $emails = ['max.muster@local.com'];

        $response = $this->actingAs($this->user)->postJson(route('api.v1.invitations.store'), [
            'email' => $emails
        ]);

        $response->assertStatus(201);

        $emails = ['mustermann.max@local.com'];

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
        $emails = ['max.muster@local.com', 'muster.max@local.com', 'max.mustermann@local.com'];

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
     * Test that create an invitation for register with emails which already existed in users table
     *
     * @return void
     */
    public function testCreateInvitationWithEmailsExistedInUserTable()
    {
        $user = factory(User::class)->create([
            'email' => 'max.muster@local.com'
        ]);

        $emails = ['max.muster@local.com'];

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
            'email' => 'max.muster@local.com'
        ]);

        $emails = ['max.muster@local.com'];

        $response = $this->actingAs($this->user)->postJson(route('api.v1.invitations.store'), [
            'email' => $emails
        ]);

        $response->assertStatus(422);
    }
}
