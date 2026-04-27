<?php

declare(strict_types=1);

namespace Tests\Backend\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Backend\TestCase;

class RobotsHeaderTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that the landing page only has the nofollow X-Robots-Tag.
     */
    public function test_landing_page_robots_header()
    {
        $response = $this->get('/');
        $response->assertOk();

        $this->assertTrue($response->headers->has('X-Robots-Tag'));
        $this->assertEquals('nofollow', $response->headers->get('X-Robots-Tag'));
    }

    /**
     * Test that API routes have X-Robots-Tag header
     * with nofollow and noindex directives
     */
    public function test_api_routes_robots_header()
    {
        $response = $this->getJson('/api/v1/config');
        $response->assertOk();

        $this->assertTrue($response->headers->has('X-Robots-Tag'));
        $this->assertEquals('nofollow, noindex', $response->headers->get('X-Robots-Tag'));
    }

    /**
     * Test that frontend routes (except the landing page) have X-Robots-Tag header
     * with nofollow and noindex directives.
     */
    public function test_frontend_routes_robots_header()
    {
        $response = $this->get('/login');
        $response->assertOk();

        $this->assertTrue($response->headers->has('X-Robots-Tag'));
        $this->assertEquals('nofollow, noindex', $response->headers->get('X-Robots-Tag'));
    }
}
