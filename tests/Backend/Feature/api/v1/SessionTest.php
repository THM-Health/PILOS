<?php

namespace Tests\Backend\Feature\api\v1;

use App\Models\Session;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;

class SessionTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;

    protected $otherUser;

    protected $currentSession;

    protected $otherSession;

    protected $otherUserSession;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();

        // Create sessions in database
        $this->currentSession = new Session;
        $this->currentSession->id = $this->app['session']->getId();
        $this->currentSession->user_agent = 'Agent 1';
        $this->currentSession->ip_address = $this->faker->ipv4;
        $this->currentSession->payload = '';
        $this->currentSession->last_activity = now();
        $this->currentSession->user()->associate($this->user);
        $this->currentSession->save();

        $this->otherSession = new Session;
        $this->otherSession->id = \Str::random(40);
        $this->otherSession->user_agent = 'Agent 2';
        $this->otherSession->ip_address = $this->faker->ipv4;
        $this->otherSession->payload = '';
        $this->otherSession->last_activity = now()->subMinutes(5);
        $this->otherSession->user()->associate($this->user);
        $this->otherSession->save();

        $this->otherUserSession = new Session;
        $this->otherUserSession->id = \Str::random(40);
        $this->otherUserSession->user_agent = 'Agent 3';
        $this->otherUserSession->ip_address = $this->faker->ipv4;
        $this->otherUserSession->payload = '';
        $this->otherUserSession->last_activity = now()->subMinutes(5);
        $this->otherUserSession->user()->associate($this->otherUser);
        $this->otherUserSession->save();
    }

    /**
     * List of all sessions of the current user
     */
    public function test_index()
    {
        // Try unauthenticated request
        $this->getJson(route('api.v1.sessions.index'))->assertUnauthorized();

        // Try authenticated request
        $response = $this->actingAs($this->user)->getJson(route('api.v1.sessions.index'))
            ->assertSuccessful();

        // Check if only the current user's sessions are returned
        $response->assertJsonCount(2, 'data');

        // Check content of the sessions, hiding session id and showing current session
        $response->assertJson([
            'data' => [
                [
                    'user_agent' => 'Agent 1',
                    'current' => true,
                    'ip_address' => $this->currentSession->ip_address,
                    'last_activity' => $this->currentSession->last_activity->toJSON(),
                ],
                [
                    'user_agent' => 'Agent 2',
                    'current' => false,
                    'ip_address' => $this->otherSession->ip_address,
                    'last_activity' => $this->otherSession->last_activity->toJSON(),
                ],
            ],
        ]);
    }

    /**
     * Delete all sessions of the current user except the current one
     */
    public function test_delete()
    {
        // Check sessions of current user and other user
        $this->assertCount(2, $this->user->sessions);
        $this->assertCount(1, $this->otherUser->sessions);

        // Try unauthenticated request
        $this->getJson(route('api.v1.sessions.destroy'))->assertUnauthorized();

        // Try authenticated request
        $this->actingAs($this->user)->deleteJson(route('api.v1.sessions.destroy'))
            ->assertNoContent();

        // Refresh models
        $this->user->refresh();
        $this->otherUser->refresh();

        // Check if only the current session is left
        $this->assertCount(1, $this->user->sessions);
        $this->assertEquals($this->currentSession->id, $this->user->sessions->first()->id);

        // Check if the other user's sessions are not affected
        $this->assertCount(1, $this->otherUser->sessions);
    }
}
