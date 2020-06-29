<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class RoutingTest extends TestCase
{
    /**
     * Tests not found responses on not existing api route.
     *
     * @return void
     */
    public function testNotExistingApiRoute()
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
    public function testOtherExistingRoute()
    {
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
    public function testUnauthenticatedApiRouteCall()
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
    public function testUnauthorizedApiRouteCallJson()
    {
        $response = $this->getJson('/api/v1/rooms');
        $response->assertUnauthorized();
        $response->assertJson([
            'message' => 'Unauthenticated.'
        ]);
    }
}
