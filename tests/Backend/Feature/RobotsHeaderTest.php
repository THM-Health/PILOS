<?php

namespace Tests\Backend\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Backend\TestCase;

class RobotsHeaderTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that the landing page does not have X-Robots-Tag header.
     */
    public function test_landing_page_no_robots_header()
    {
        $response = $this->get('/');
        $response->assertOk();

        $this->assertFalse($response->headers->has('X-Robots-Tag'));
    }

    /**
     * Test that API routes do not have X-Robots-Tag header (middleware not in 'api' group).
     */
    public function test_api_routes_no_robots_header()
    {
        $response = $this->getJson('/api/v1/config');
        $response->assertOk();

        $this->assertFalse($response->headers->has('X-Robots-Tag'));
    }

    /**
     * Test that frontend routes (except the landing page) have X-Robots-Tag header.
     */
    public function test_frontend_routes_robots_header()
    {
        $response = $this->get('/login');
        $response->assertOk();

        $this->assertTrue($response->headers->has('X-Robots-Tag'));
        $this->assertEquals('noindex', $response->headers->get('X-Robots-Tag'));
    }
}
