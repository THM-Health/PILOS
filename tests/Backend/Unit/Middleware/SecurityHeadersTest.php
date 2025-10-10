<?php

namespace Tests\Backend\Unit\Middleware;

use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Tests\Backend\TestCase;

class SecurityHeadersTest extends TestCase
{
    use RefreshDatabase;

    protected SecurityHeaders $middleware;

    protected function setUp(): void
    {
        parent::setUp();
        $this->middleware = new SecurityHeaders();
    }

    public function test_sets_x_xss_protection_header()
    {
        $request = Request::create('/test', 'GET');
        
        $response = $this->middleware->handle($request, function ($req) {
            return new Response('test content');
        });

        $this->assertEquals('0', $response->headers->get('X-XSS-Protection'));
    }

    public function test_sets_x_content_type_options_header()
    {
        $request = Request::create('/test', 'GET');
        
        $response = $this->middleware->handle($request, function ($req) {
            return new Response('test content');
        });

        $this->assertEquals('nosniff', $response->headers->get('X-Content-Type-Options'));
    }

    public function test_sets_referrer_policy_from_config()
    {
        config(['security.referrer_policy' => 'no-referrer']);
        
        $request = Request::create('/test', 'GET');
        
        $response = $this->middleware->handle($request, function ($req) {
            return new Response('test content');
        });

        $this->assertEquals('no-referrer', $response->headers->get('Referrer-Policy'));
    }

    public function test_sets_default_referrer_policy_when_not_configured()
    {
        config(['security.referrer_policy' => 'strict-origin-when-cross-origin']);
        
        $request = Request::create('/test', 'GET');
        
        $response = $this->middleware->handle($request, function ($req) {
            return new Response('test content');
        });

        $this->assertEquals('strict-origin-when-cross-origin', $response->headers->get('Referrer-Policy'));
    }

    public function test_does_not_set_hsts_header_when_disabled()
    {
        config(['security.hsts.enabled' => false]);
        
        $request = Request::create('/test', 'GET');
        
        $response = $this->middleware->handle($request, function ($req) {
            return new Response('test content');
        });

        $this->assertNull($response->headers->get('Strict-Transport-Security'));
    }

    public function test_does_not_set_hsts_header_in_local_environment()
    {
        config(['security.hsts.enabled' => true]);
        config(['security.hsts.max_age' => 31536000]);
        $this->app['env'] = 'local';
        
        $request = Request::create('/test', 'GET');
        
        $response = $this->middleware->handle($request, function ($req) {
            return new Response('test content');
        });

        $this->assertNull($response->headers->get('Strict-Transport-Security'));
    }

    public function test_sets_hsts_header_with_max_age_when_enabled()
    {
        config(['security.hsts.enabled' => true]);
        config(['security.hsts.max_age' => 31536000]);
        config(['security.hsts.include_subdomains' => false]);
        config(['security.hsts.preload' => false]);
        $this->app['env'] = 'production';
        
        $request = Request::create('/test', 'GET');
        
        $response = $this->middleware->handle($request, function ($req) {
            return new Response('test content');
        });

        $this->assertEquals('max-age=31536000', $response->headers->get('Strict-Transport-Security'));
    }

    public function test_sets_hsts_header_with_include_subdomains()
    {
        config(['security.hsts.enabled' => true]);
        config(['security.hsts.max_age' => 31536000]);
        config(['security.hsts.include_subdomains' => true]);
        config(['security.hsts.preload' => false]);
        $this->app['env'] = 'production';
        
        $request = Request::create('/test', 'GET');
        
        $response = $this->middleware->handle($request, function ($req) {
            return new Response('test content');
        });

        $this->assertEquals('max-age=31536000; includeSubDomains', $response->headers->get('Strict-Transport-Security'));
    }

    public function test_sets_hsts_header_with_preload()
    {
        config(['security.hsts.enabled' => true]);
        config(['security.hsts.max_age' => 31536000]);
        config(['security.hsts.include_subdomains' => false]);
        config(['security.hsts.preload' => true]);
        $this->app['env'] = 'production';
        
        $request = Request::create('/test', 'GET');
        
        $response = $this->middleware->handle($request, function ($req) {
            return new Response('test content');
        });

        $this->assertEquals('max-age=31536000; preload', $response->headers->get('Strict-Transport-Security'));
    }

    public function test_sets_hsts_header_with_all_options()
    {
        config(['security.hsts.enabled' => true]);
        config(['security.hsts.max_age' => 63072000]);
        config(['security.hsts.include_subdomains' => true]);
        config(['security.hsts.preload' => true]);
        $this->app['env'] = 'production';
        
        $request = Request::create('/test', 'GET');
        
        $response = $this->middleware->handle($request, function ($req) {
            return new Response('test content');
        });

        $this->assertEquals('max-age=63072000; includeSubDomains; preload', $response->headers->get('Strict-Transport-Security'));
    }

    public function test_sets_hsts_header_with_different_max_age_values()
    {
        $maxAgeValues = [0, 3600, 86400, 2592000, 31536000, 63072000];
        
        foreach ($maxAgeValues as $maxAge) {
            config(['security.hsts.enabled' => true]);
            config(['security.hsts.max_age' => $maxAge]);
            config(['security.hsts.include_subdomains' => false]);
            config(['security.hsts.preload' => false]);
            $this->app['env'] = 'production';
            
            $request = Request::create('/test', 'GET');
            
            $response = $this->middleware->handle($request, function ($req) {
                return new Response('test content');
            });

            $this->assertEquals("max-age={$maxAge}", $response->headers->get('Strict-Transport-Security'));
        }
    }

    public function test_sets_all_headers_simultaneously()
    {
        config(['security.referrer_policy' => 'same-origin']);
        config(['security.hsts.enabled' => true]);
        config(['security.hsts.max_age' => 31536000]);
        config(['security.hsts.include_subdomains' => true]);
        config(['security.hsts.preload' => true]);
        $this->app['env'] = 'production';
        
        $request = Request::create('/test', 'GET');
        
        $response = $this->middleware->handle($request, function ($req) {
            return new Response('test content');
        });

        $this->assertEquals('0', $response->headers->get('X-XSS-Protection'));
        $this->assertEquals('nosniff', $response->headers->get('X-Content-Type-Options'));
        $this->assertEquals('same-origin', $response->headers->get('Referrer-Policy'));
        $this->assertEquals('max-age=31536000; includeSubDomains; preload', $response->headers->get('Strict-Transport-Security'));
    }

    public function test_does_not_modify_existing_response_content()
    {
        $expectedContent = 'original response content';
        $request = Request::create('/test', 'GET');
        
        $response = $this->middleware->handle($request, function ($req) use ($expectedContent) {
            return new Response($expectedContent);
        });

        $this->assertEquals($expectedContent, $response->getContent());
    }

    public function test_preserves_response_status_code()
    {
        $request = Request::create('/test', 'GET');
        
        $response = $this->middleware->handle($request, function ($req) {
            return new Response('test', 201);
        });

        $this->assertEquals(201, $response->getStatusCode());
    }

    public function test_handles_json_response()
    {
        $request = Request::create('/api/test', 'GET');
        
        $response = $this->middleware->handle($request, function ($req) {
            return response()->json(['data' => 'test']);
        });

        $this->assertEquals('0', $response->headers->get('X-XSS-Protection'));
        $this->assertEquals('nosniff', $response->headers->get('X-Content-Type-Options'));
        $this->assertJson($response->getContent());
    }

    public function test_handles_redirect_response()
    {
        $request = Request::create('/test', 'GET');
        
        $response = $this->middleware->handle($request, function ($req) {
            return redirect('/other-page');
        });

        $this->assertEquals('0', $response->headers->get('X-XSS-Protection'));
        $this->assertEquals('nosniff', $response->headers->get('X-Content-Type-Options'));
        $this->assertTrue($response->isRedirect());
    }

    public function test_referrer_policy_with_various_valid_values()
    {
        $policies = [
            'no-referrer',
            'no-referrer-when-downgrade',
            'origin',
            'origin-when-cross-origin',
            'same-origin',
            'strict-origin',
            'strict-origin-when-cross-origin',
            'unsafe-url',
        ];
        
        foreach ($policies as $policy) {
            config(['security.referrer_policy' => $policy]);
            
            $request = Request::create('/test', 'GET');
            
            $response = $this->middleware->handle($request, function ($req) {
                return new Response('test');
            });

            $this->assertEquals($policy, $response->headers->get('Referrer-Policy'));
        }
    }

    public function test_hsts_in_testing_environment()
    {
        config(['security.hsts.enabled' => true]);
        config(['security.hsts.max_age' => 31536000]);
        $this->app['env'] = 'testing';
        
        $request = Request::create('/test', 'GET');
        
        $response = $this->middleware->handle($request, function ($req) {
            return new Response('test content');
        });

        // HSTS should be set in testing environment (not local)
        $this->assertEquals('max-age=31536000', $response->headers->get('Strict-Transport-Security'));
    }

    public function test_middleware_does_not_interfere_with_other_headers()
    {
        $request = Request::create('/test', 'GET');
        
        $response = $this->middleware->handle($request, function ($req) {
            $response = new Response('test content');
            $response->headers->set('X-Custom-Header', 'custom-value');
            $response->headers->set('Cache-Control', 'no-cache');
            return $response;
        });

        $this->assertEquals('custom-value', $response->headers->get('X-Custom-Header'));
        $this->assertEquals('no-cache', $response->headers->get('Cache-Control'));
    }
}