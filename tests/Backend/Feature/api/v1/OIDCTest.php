<?php

namespace Tests\Backend\Feature\api\v1;

use App\Models\Role;
use App\Models\User;
use Config;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Http;
use Tests\Backend\TestCase;

class OIDCTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    private $mapping = '
    {
        "attributes": {
          "external_id": "principalname",
          "first_name": "givenname",
          "last_name": "surname",
          "email": "mail",
          "affiliation": "scoped-affiliation"
        },
        "roles": [
          {
            "name": "admin",
            "disabled": false,
            "all": true,
            "rules": [
              {
                "attribute": "mail",
                "regex": "/@it.university.org$/i"
              },
              {
                "attribute": "affiliation",
                "regex": "/^(staff|employee)@university.org$/i"
              }
            ]
          },
          {
            "name": "user",
            "disabled": false,
            "rules": [
              {
                "attribute": "affiliation",
                "regex": "/^faculty@university.org$/i"
              },
              {
                "attribute": "affiliation",
                "regex": "/^student@university.org$/i"
              },
              {
                "attribute": "affiliation",
                "regex": "/^staff@university.org$/i"
              },
              {
                "attribute": "affiliation",
                "regex": "/^employee@university.org$/i"
              }
            ]
          },
          {
            "name": "guests",
            "disabled": false,
            "rules": [
              {
                "attribute": "external_id",
                "not": true,
                "regex": "/@university.org$/i"
              }
            ]
          }
        ]
      }
    ';

    /**
     * Setup resources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        Config::set('services.oidc.enabled', true);
        Config::set('services.oidc.client_id', 'fake-client-id');
        Config::set('services.oidc.client_secret', 'fake-client-secret');
        Config::set('services.oidc.issuer', 'https://example.org');
        Config::set('services.oidc.scopes', ['profile', 'email']);

        Config::set('services.oidc.leeway', 60);
        Config::set('services.oidc.timeout', 10);
        Config::set('services.oidc.cache_config_max_age', 0);
        Config::set('services.oidc.cache_jwks_max_age', 0);

        Config::set('services.oidc.mapping', json_decode($this->mapping));
        Config::set('app.enabled_locales', ['de' => ['name' => 'Deutsch', 'dateTimeFormat' => []], 'en' => ['name' => 'English', 'dateTimeFormat' => []], 'fr' => ['name' => 'Français', 'dateTimeFormat' => []]]);

        Role::factory()->create(['name' => 'admin']);
        Role::factory()->create(['name' => 'user']);
        Role::factory()->create(['name' => 'guests']);

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response([
                'issuer' => 'https://example.org/',
                'authorization_endpoint' => 'https://example.org/authorize',
                'token_endpoint' => 'https://example.org/token',
                'userinfo_endpoint' => 'https://example.org/userinfo',
                'jwks_uri' => 'https://example.org/jwks',
                'response_types_supported' => ['code', 'id_token'],
                'subject_types_supported' => ['public'],
                'id_token_signing_alg_values_supported' => ['RS256'],
            ]),
        ]);
    }

    /**
     * Test that the redirect route is disabled if disabled in env
     *
     * @return void
     */
    public function test_redirect_route_disabled()
    {
        Config::set('services.oidc.enabled', false);
        $response = $this->get(route('auth.oidc.redirect'));
        $response->assertNotFound();
    }

    /**
     * Test that the redirect route redirects to the external login page
     * with an error if the OIDC provider is not reachable
     *
     * @return void
     */
    public function test_redirect_route_error()
    {
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::failedConnection(),
        ]);

        $response = $this->get(route('auth.oidc.redirect'));
        $redirect = $response->headers->get('Location');
        $this->assertEquals('http://localhost/external_login?error=openid_connect_network_exception', $redirect);
    }

    /**
     * Test that the redirect route is returning the authorization endpoint
     * of the OIDC provider with the correct parameters
     *
     * @return void
     */
    public function test_redirect_route()
    {
        $response = $this->get(route('auth.oidc.redirect', ['redirect' => '/rooms/abc-123-def']));

        $redirect = $response->headers->get('Location');

        $redirectParts = parse_url($redirect);

        $this->assertEquals('https', $redirectParts['scheme']);
        $this->assertEquals('example.org', $redirectParts['host']);
        $this->assertEquals('/authorize', $redirectParts['path']);

        $queryParams = [];
        parse_str($redirectParts['query'], $queryParams);

        $this->assertEquals('fake-client-id', $queryParams['client_id']);
        $this->assertEquals('code', $queryParams['response_type']);
        $this->assertEquals('http://localhost/auth/oidc/callback', $queryParams['redirect_uri']);
        $this->assertEquals('openid profile email', $queryParams['scope']);

        $this->assertEquals(\Illuminate\Support\Facades\Session::get('openid_connect_nonce'), $queryParams['nonce']);
        $this->assertEquals(\Illuminate\Support\Facades\Session::get('openid_connect_state'), $queryParams['state']);

    }

    /**
     * Test that the callback route is disabled if disabled in env
     *
     * @return void
     */
    public function test_callback_route_disabled()
    {
        Config::set('services.oidc.enabled', false);
        $response = $this->get(route('auth.oidc.callback'));
        $response->assertNotFound();
    }

    /**
     * Test that the callback route cannot be accessed by logged in users
     *
     * @return void
     */
    public function test_callback_route_as_logged_in_user()
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->get(route('auth.oidc.callback'));
        $response->assertStatus(420);
    }
}
