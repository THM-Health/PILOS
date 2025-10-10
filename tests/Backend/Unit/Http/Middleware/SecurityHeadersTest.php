<?php

namespace Tests\Backend\Unit\Http\Middleware;

use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Tests\Backend\TestCase;

class SecurityHeadersTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected SecurityHeaders $middleware;

    protected function setUp(): void
    {
        parent::setUp();
        $this->middleware = new SecurityHeaders();
    }

    public function test_sets_x_xss_protection_header_to_zero()
    {
        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $req;
            return new Response('test');
        });

        $this->assertEquals('0', $response->headers->get('X-XSS-Protection'));
    }

    public function test_sets_x_content_type_options_header()
    {
        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $req;
            return new Response('test');
        });

        $this->assertEquals('nosniff', $response->headers->get('X-Content-Type-Options'));
    }

    public function test_sets_referrer_policy_header_from_config()
    {
        config(['security.referrer_policy' => 'strict-origin-when-cross-origin']);

        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $req;
            return new Response('test');
        });

        $this->assertEquals('strict-origin-when-cross-origin', $response->headers->get('Referrer-Policy'));
    }

    public function test_referrer_policy_uses_custom_value_from_config()
    {
        config(['security.referrer_policy' => 'no-referrer']);

        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $req;
            return new Response('test');
        });

        $this->assertEquals('no-referrer', $response->headers->get('Referrer-Policy'));
    }

    public function test_hsts_header_not_set_when_disabled()
    {
        config(['security.hsts.enabled' => false]);

        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $req;
            return new Response('test');
        });

        $this->assertNull($response->headers->get('Strict-Transport-Security'));
    }

    public function test_hsts_header_not_set_in_local_environment()
    {
        config(['security.hsts.enabled' => true]);
        app()->detectEnvironment(function () {
            return 'local';
        });

        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $req;
            return new Response('test');
        });

        $this->assertNull($response->headers->get('Strict-Transport-Security'));
    }

    public function test_hsts_header_set_with_max_age_only()
    {
        config([
            'security.hsts.enabled' => true,
            'security.hsts.max_age' => 31536000,
            'security.hsts.include_subdomains' => false,
            'security.hsts.preload' => false,
        ]);

        app()->detectEnvironment(function () {
            return 'production';
        });

        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $req;
            return new Response('test');
        });

        $this->assertEquals('max-age=31536000', $response->headers->get('Strict-Transport-Security'));
    }

    public function test_hsts_header_includes_subdomains_when_enabled()
    {
        config([
            'security.hsts.enabled' => true,
            'security.hsts.max_age' => 31536000,
            'security.hsts.include_subdomains' => true,
            'security.hsts.preload' => false,
        ]);

        app()->detectEnvironment(function () {
            return 'production';
        });

        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $req;
            return new Response('test');
        });

        $this->assertEquals('max-age=31536000; includeSubDomains', $response->headers->get('Strict-Transport-Security'));
    }

    public function test_hsts_header_includes_preload_when_enabled()
    {
        config([
            'security.hsts.enabled' => true,
            'security.hsts.max_age' => 31536000,
            'security.hsts.include_subdomains' => false,
            'security.hsts.preload' => true,
        ]);

        app()->detectEnvironment(function () {
            return 'production';
        });

        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $req;
            return new Response('test');
        });

        $this->assertEquals('max-age=31536000; preload', $response->headers->get('Strict-Transport-Security'));
    }

    public function test_hsts_header_includes_all_options_when_enabled()
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

        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $req;
            return new Response('test');
        });

        $this->assertEquals('max-age=63072000; includeSubDomains; preload', $response->headers->get('Strict-Transport-Security'));
    }

    public function test_hsts_respects_custom_max_age()
    {
        config([
            'security.hsts.enabled' => true,
            'security.hsts.max_age' => 7776000, // 90 days
            'security.hsts.include_subdomains' => false,
            'security.hsts.preload' => false,
        ]);

        app()->detectEnvironment(function () {
            return 'production';
        });

        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $req;
            return new Response('test');
        });

        $this->assertEquals('max-age=7776000', $response->headers->get('Strict-Transport-Security'));
    }

    public function test_middleware_preserves_existing_response_content()
    {
        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $req;
            return new Response('original content', 200);
        });

        $this->assertEquals('original content', $response->getContent());
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_middleware_preserves_json_responses()
    {
        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $req;
            return response()->json(['key' => 'value']);
        });

        $this->assertEquals('{"key":"value"}', $response->getContent());
        $this->assertEquals('application/json', $response->headers->get('Content-Type'));
    }

    public function test_middleware_works_with_redirect_responses()
    {
        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $req;
            return redirect('/home');
        });

        $this->assertEquals(302, $response->getStatusCode());
        $this->assertEquals('/home', $response->headers->get('Location'));
        $this->assertNotNull($response->headers->get('X-XSS-Protection'));
        $this->assertNotNull($response->headers->get('X-Content-Type-Options'));
    }

    public function test_all_security_headers_set_together()
    {
        config([
            'security.referrer_policy' => 'strict-origin-when-cross-origin',
            'security.hsts.enabled' => true,
            'security.hsts.max_age' => 31536000,
            'security.hsts.include_subdomains' => true,
            'security.hsts.preload' => true,
        ]);

        app()->detectEnvironment(function () {
            return 'production';
        });

        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $req;
            return new Response('test');
        });

        $this->assertEquals('0', $response->headers->get('X-XSS-Protection'));
        $this->assertEquals('nosniff', $response->headers->get('X-Content-Type-Options'));
        $this->assertEquals('strict-origin-when-cross-origin', $response->headers->get('Referrer-Policy'));
        $this->assertEquals('max-age=31536000; includeSubDomains; preload', $response->headers->get('Strict-Transport-Security'));
    }

    public function test_middleware_handles_post_requests()
    {
        $request = Request::create('/test', 'POST', ['data' => 'value']);

        $response = $this->middleware->handle($request, function ($req) {
            $req;
            return new Response('test');
        });

        $this->assertEquals('0', $response->headers->get('X-XSS-Protection'));
        $this->assertEquals('nosniff', $response->headers->get('X-Content-Type-Options'));
    }

    public function test_middleware_handles_different_http_methods()
    {
        $methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

        foreach ($methods as $method) {
            $request = Request::create('/test', $method);

            $response = $this->middleware->handle($request, function ($req) {
                $req;
                return new Response('test');
            });

            $this->assertEquals('0', $response->headers->get('X-XSS-Protection'), "Failed for method: $method");
            $this->assertEquals('nosniff', $response->headers->get('X-Content-Type-Options'), "Failed for method: $method");
        }
    }

    public function test_hsts_in_testing_environment()
    {
        config([
            'security.hsts.enabled' => true,
            'security.hsts.max_age' => 31536000,
        ]);

        app()->detectEnvironment(function () {
            return 'testing';
        });

        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $req;
            return new Response('test');
        });

        $this->assertEquals('max-age=31536000', $response->headers->get('Strict-Transport-Security'));
    }

    public function test_hsts_with_zero_max_age()
    {
        config([
            'security.hsts.enabled' => true,
            'security.hsts.max_age' => 0,
            'security.hsts.include_subdomains' => false,
            'security.hsts.preload' => false,
        ]);

        app()->detectEnvironment(function () {
            return 'production';
        });

        $request = Request::create('/test', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $req;
            return new Response('test');
        });

        $this->assertEquals('max-age=0', $response->headers->get('Strict-Transport-Security'));
    }

    public function test_referrer_policy_with_different_valid_values()
    {
        $validPolicies = [
            'no-referrer',
            'no-referrer-when-downgrade',
            'origin',
            'origin-when-cross-origin',
            'same-origin',
            'strict-origin',
            'strict-origin-when-cross-origin',
            'unsafe-url',
        ];

        foreach ($validPolicies as $policy) {
            config(['security.referrer_policy' => $policy]);

            $request = Request::create('/test', 'GET');

            $response = $this->middleware->handle($request, function ($req) {
                $req;
                return new Response('test');
            });

            $this->assertEquals($policy, $response->headers->get('Referrer-Policy'), "Failed for policy: $policy");
        }
    }
}