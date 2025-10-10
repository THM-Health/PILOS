<?php

namespace Tests\Backend\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;

class SecurityHeadersIntegrationTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_security_headers_applied_to_api_requests()
    {
        $response = $this->get('/api/v1/currentUser');

        $response->assertHeader('X-XSS-Protection', '0');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->assertNotNull($response->headers->get('Referrer-Policy'));
    }

    public function test_security_headers_applied_to_root_request()
    {
        $response = $this->get('/');

        $response->assertHeader('X-XSS-Protection', '0');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->assertNotNull($response->headers->get('Referrer-Policy'));
    }

    public function test_security_headers_with_custom_referrer_policy()
    {
        config(['security.referrer_policy' => 'no-referrer']);

        $response = $this->get('/');

        $response->assertHeader('Referrer-Policy', 'no-referrer');
    }

    public function test_hsts_header_not_set_when_disabled()
    {
        config(['security.hsts.enabled' => false]);

        $response = $this->get('/');

        $this->assertNull($response->headers->get('Strict-Transport-Security'));
    }

    public function test_hsts_header_set_when_enabled_in_non_local_environment()
    {
        config([
            'security.hsts.enabled' => true,
            'security.hsts.max_age' => 31536000,
        ]);

        app()->detectEnvironment(function () {
            return 'production';
        });

        $response = $this->get('/');

        $hsts = $response->headers->get('Strict-Transport-Security');
        $this->assertNotNull($hsts);
        $this->assertStringContainsString('max-age=31536000', $hsts);
    }

    public function test_security_headers_on_post_request()
    {
        $response = $this->post('/api/v1/login', [
            'email' => 'test@example.com',
            'password' => 'password',
        ]);

        $response->assertHeader('X-XSS-Protection', '0');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->assertNotNull($response->headers->get('Referrer-Policy'));
    }

    public function test_security_headers_on_json_response()
    {
        $response = $this->getJson('/api/v1/currentUser');

        $response->assertHeader('X-XSS-Protection', '0');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->assertNotNull($response->headers->get('Referrer-Policy'));
    }

    public function test_security_headers_on_404_response()
    {
        $response = $this->get('/nonexistent-route');

        $response->assertHeader('X-XSS-Protection', '0');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->assertNotNull($response->headers->get('Referrer-Policy'));
    }

    public function test_security_headers_on_redirect_response()
    {
        $response = $this->get('/redirect-test', ['HTTP_REFERER' => 'http://example.com']);

        $response->assertHeader('X-XSS-Protection', '0');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
    }

    public function test_hsts_with_all_options_enabled()
    {
        config([
            'security.hsts.enabled' => true,
            'security.hsts.max_age' => 63072000,
            'security.hsts.include_subdomains' => true,
            'security.hsts.preload' => true,
        ]);

        app()->detectEnvironment(function () {
            return 'production';
        });

        $response = $this->get('/');

        $hsts = $response->headers->get('Strict-Transport-Security');
        $this->assertStringContainsString('max-age=63072000', $hsts);
        $this->assertStringContainsString('includeSubDomains', $hsts);
        $this->assertStringContainsString('preload', $hsts);
    }

    public function test_x_content_type_options_prevents_mime_sniffing()
    {
        $response = $this->get('/');

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
    }

    public function test_x_xss_protection_disabled_as_recommended()
    {
        // Modern recommendation is to disable X-XSS-Protection
        // as it can introduce vulnerabilities
        $response = $this->get('/');

        $response->assertHeader('X-XSS-Protection', '0');
    }

    public function test_referrer_policy_set_on_all_responses()
    {
        $routes = [
            '/',
            '/api/v1/currentUser',
        ];

        foreach ($routes as $route) {
            $response = $this->get($route);
            $this->assertNotNull(
                $response->headers->get('Referrer-Policy'),
                "Referrer-Policy not set for route: $route"
            );
        }
    }

    public function test_security_headers_consistent_across_request_types()
    {
        $getResponse = $this->get('/');
        $postResponse = $this->post('/api/v1/login', []);

        $this->assertEquals(
            $getResponse->headers->get('X-XSS-Protection'),
            $postResponse->headers->get('X-XSS-Protection')
        );

        $this->assertEquals(
            $getResponse->headers->get('X-Content-Type-Options'),
            $postResponse->headers->get('X-Content-Type-Options')
        );
    }

    public function test_security_headers_with_different_content_types()
    {
        // HTML response
        $htmlResponse = $this->get('/');
        $htmlResponse->assertHeader('X-Content-Type-Options', 'nosniff');

        // JSON response
        $jsonResponse = $this->getJson('/api/v1/currentUser');
        $jsonResponse->assertHeader('X-Content-Type-Options', 'nosniff');
    }

    public function test_hsts_respects_environment()
    {
        config([
            'security.hsts.enabled' => true,
            'security.hsts.max_age' => 31536000,
        ]);

        // In testing environment (not local), HSTS should be set
        $response = $this->get('/');
        $this->assertNotNull($response->headers->get('Strict-Transport-Security'));
    }

    public function test_multiple_requests_maintain_security_headers()
    {
        for ($i = 0; $i < 5; $i++) {
            $response = $this->get('/');

            $response->assertHeader('X-XSS-Protection', '0');
            $response->assertHeader('X-Content-Type-Options', 'nosniff');
            $this->assertNotNull($response->headers->get('Referrer-Policy'));
        }
    }

    public function test_security_headers_do_not_interfere_with_other_headers()
    {
        $response = $this->get('/');

        // Check that common headers are still present
        $this->assertNotNull($response->headers->get('Content-Type'));
        $this->assertNotNull($response->headers->get('Cache-Control'));
    }

    public function test_referrer_policy_various_valid_values()
    {
        $policies = [
            'no-referrer',
            'strict-origin-when-cross-origin',
            'origin',
            'same-origin',
        ];

        foreach ($policies as $policy) {
            config(['security.referrer_policy' => $policy]);

            $response = $this->get('/');

            $response->assertHeader('Referrer-Policy', $policy);
        }
    }
}