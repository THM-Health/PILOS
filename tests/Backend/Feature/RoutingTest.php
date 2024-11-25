<?php

namespace Tests\Backend\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Tests\Backend\TestCase;

class RoutingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Tests not found responses on not existing api route.
     *
     * @return void
     */
    public function test_not_existing_api_route()
    {
        $response = $this->get('/api/not/existing/route');
        $response->assertNotFound();

        $response = $this->get('/api/v1/not/existing/route');
        $response->assertNotFound();
    }

    /**
     * Test existing normal (not api) routes.
     *
     * @return void
     */
    public function test_other_existing_route()
    {
        $this->withoutMix();
        $response = $this->get('/login');
        $response->assertOk();
        $response->assertViewIs('application');
    }

    /**
     * Test unauthenticated call for protected api routes accepting normal html responses.
     * In this case a redirect to the login page should be returned.
     *
     * @return void
     */
    public function test_unauthenticated_api_route_call()
    {
        $response = $this->get('/api/v1/rooms');
        $response->assertRedirect(URL::to('/login'));
    }

    /**
     * Test unauthenticated call for protected api routes accepting json responses.
     * In this case a unauthenticated error should be returned.
     *
     * @return void
     */
    public function test_unauthorized_api_route_call_json()
    {
        $response = $this->getJson('/api/v1/rooms');
        $response->assertUnauthorized();
        $response->assertJson([
            'message' => 'Unauthenticated.',
        ]);
    }
}
