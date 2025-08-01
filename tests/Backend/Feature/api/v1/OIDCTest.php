<?php

namespace Tests\Backend\Feature\api\v1;

use App\Models\Role;
use App\Models\User;
use Config;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Jose\Component\KeyManagement\JWKFactory;
use Jose\Component\Signature\Algorithm\RS256;
use Tests\Backend\TestCase;
use Tests\Backend\Utils\JWTTestHelpers;
use TiMacDonald\Log\LogEntry;
use TiMacDonald\Log\LogFake;

class OIDCTest extends TestCase
{
    use JWTTestHelpers, RefreshDatabase, WithFaker;

    private $mapping = '
    {
        "attributes": {
          "external_id": "sub",
          "first_name": "given_name",
          "last_name": "family_name",
          "email": "email",
          "groups": "groups"
        },
        "roles": [
          {
            "name": "admin",
            "disabled": false,
            "all": true,
            "rules": [
              {
                "attribute": "email",
                "regex": "/@it.university.org$/i"
              },
              {
                "attribute": "groups",
                "regex": "/^(staff|employee)$/i"
              }
            ]
          },
          {
            "name": "user",
            "disabled": false,
            "rules": [
              {
                "attribute": "groups",
                "regex": "/^faculty$/i"
              },
              {
                "attribute": "groups",
                "regex": "/^student$/i"
              },
              {
                "attribute": "groups",
                "regex": "/^staff$/i"
              },
              {
                "attribute": "groups",
                "regex": "/^employee$/i"
              }
            ]
          }
        ]
      }
    ';

    private $discovery = [
        'issuer' => 'https://example.org',
        'authorization_endpoint' => 'https://example.org/authorize',
        'token_endpoint' => 'https://example.org/token',
        'userinfo_endpoint' => 'https://example.org/userinfo',
        'jwks_uri' => 'https://example.org/jwks',
        'response_types_supported' => ['code', 'id_token'],
        'subject_types_supported' => ['public'],
        'id_token_signing_alg_values_supported' => ['RS256'],
    ];

    /**
     * Setup resources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
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
    public function test_redirect_route_network_error()
    {
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::failedConnection(),
        ]);

        $response = $this->get(route('auth.oidc.redirect'));
        $redirect = $response->headers->get('Location');
        $this->assertEquals('http://localhost/external_login?error=openid_connect_network_exception', $redirect);
    }

    /**
     * Test that the redirect route redirects to the external login page
     * with an error if the OIDC provider returns an invalid configuration
     *
     * @return void
     */
    public function test_redirect_route_error()
    {
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response([]),
        ]);

        $response = $this->get(route('auth.oidc.redirect'));
        $redirect = $response->headers->get('Location');
        $this->assertEquals('http://localhost/external_login?error=openid_connect_exception', $redirect);
    }

    /**
     * Test that the redirect route is returning the authorization endpoint
     * of the OIDC provider with the correct parameters
     *
     * @return void
     */
    public function test_redirect_route()
    {
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
        ]);

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
     * Test that the callback route cannot be accessed by logged-in users
     *
     * @return void
     */
    public function test_callback_route_as_logged_in_user()
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->get(route('auth.oidc.callback'));
        $response->assertStatus(420);
    }

    public function test_callback_route_missing_code()
    {
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
        ]);

        $response = $this->get(route('auth.oidc.callback'));
        $response->assertRedirect('http://localhost/auth/oidc/redirect');
        $this->assertGuest();
    }

    public function test_callback_with_user_info_signed()
    {
        $this->generalSettings->default_timezone = 'Europe/Paris';
        $this->generalSettings->save();

        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $public_key = $private_key->toPublic();

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'at_hash' => $this->base64url_encode(substr(hash('sha256', 'fake-access-token', true), 0, 16)),
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
            'groups' => ['student', 'staff'],
        ];

        // Sign user info claims
        $userInfoResponse = $this->signClaims($userInfoClaims, $private_key, 'RS256', ['kid' => $kid]);

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [[
            'kid' => $kid,
            ...$public_key->jsonSerialize(),
        ]];

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::response($userInfoResponse, 200, [
                'Content-Type' => 'application/jwt',
            ]),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $header = [
            'Accept-Language' => 'fr',
        ];

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]), $header);

        $recorded = Http::recorded();

        // Check well-known configuration is fetched
        $this->assertEquals('https://example.org/.well-known/openid-configuration', $recorded[0][0]->url());

        // Check if token is requested using client_secret_basic authentication and the correct parameters
        $this->assertEquals('https://example.org/token', $recorded[1][0]->url());
        $this->assertEquals('Basic ZmFrZS1jbGllbnQtaWQ6ZmFrZS1jbGllbnQtc2VjcmV0', $recorded[1][0]->header('Authorization')[0]);
        $this->assertEquals('authorization_code', $recorded[1][0]->data()['grant_type']);
        $this->assertEquals($code, $recorded[1][0]->data()['code']);
        $this->assertEquals('http://localhost/auth/oidc/callback', $recorded[1][0]->data()['redirect_uri']);

        // Check if JWKS is requested as the token is signed with RS256
        $this->assertEquals('https://example.org/jwks', $recorded[2][0]->url());

        // Check if userinfo is requested with the access token
        $this->assertEquals('https://example.org/userinfo', $recorded[3][0]->url());
        $this->assertEquals('Bearer fake-access-token', $recorded[3][0]->header('Authorization')[0]);

        $response->assertRedirect('http://localhost/external_login');
        $this->assertAuthenticated();

        $this->assertCount(1, \App\Models\Session::all());

        $this->withCookies([session()->getName() => \App\Models\Session::first()->id])->get($response->getTargetUrl());
        $this->assertAuthenticated();

        $user = Auth::user();

        $session = $user->sessions()->first();

        $this->assertEquals($sid, $session->sessionData()->where('key', 'oidc_sid')->first()->value);
        $this->assertEquals($sub, $session->sessionData()->where('key', 'oidc_sub')->first()->value);

        $this->assertEquals($firstName, $user->firstname);
        $this->assertEquals($lastName, $user->lastname);
        $this->assertEquals($email, $user->email);
        $this->assertEquals('oidc', $user->authenticator);
        $this->assertEquals($sub, $user->external_id);
        $this->assertEquals('fr', $user->locale);
        $this->assertEquals('Europe/Paris', $user->timezone);

        $this->assertEquals($user->roles()->pluck('name')->toArray(), ['user']);

    }

    public function test_set_last_login()
    {
        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $public_key = $private_key->toPublic();

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'at_hash' => $this->base64url_encode(substr(hash('sha256', 'fake-access-token', true), 0, 16)),
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
        ];

        // Sign user info claims
        $userInfoResponse = $this->signClaims($userInfoClaims, $private_key, 'RS256', ['kid' => $kid]);

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [[
            'kid' => $kid,
            ...$public_key->jsonSerialize(),
        ]];

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::response($userInfoResponse, 200, [
                'Content-Type' => 'application/jwt',
            ]),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $header = [
            'Accept-Language' => 'fr',
        ];

        $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]), $header);
        $this->assertAuthenticated();

        // check login timestamp was correctly set to login time
        $this->travel(5)->days();
        $user = Auth::user();
        $this->assertEquals(-5, (int) now()->diffInDays($user->last_login));
    }

    public function test_logging()
    {
        Log::swap(new LogFake);

        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $public_key = $private_key->toPublic();

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'at_hash' => $this->base64url_encode(substr(hash('sha256', 'fake-access-token', true), 0, 16)),
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
        ];

        // Sign user info claims
        $userInfoResponse = $this->signClaims($userInfoClaims, $private_key, 'RS256', ['kid' => $kid]);

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [[
            'kid' => $kid,
            ...$public_key->jsonSerialize(),
        ]];

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::response($userInfoResponse, 200, [
                'Content-Type' => 'application/jwt',
            ]),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $header = [
            'Accept-Language' => 'fr',
        ];

        $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]), $header);
        $this->assertAuthenticated();

        $this->assertAuthenticated();
        $user = Auth::user();

        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'info'
                && $log->message == 'External user {user} has been successfully authenticated.'
                && $log->context['user'] == $user->getLogLabel()
                && $log->context['ip'] == '127.0.0.1'
                && $log->context['current-user'] == 'guest'
                && $log->context['type'] == 'oidc'
        );
    }

    public function test_callback_with_existing_user()
    {
        $user = User::factory()->create([
            'authenticator' => 'oidc',
            'external_id' => 'johnd',
            'firstname' => 'Max',
            'lastname' => 'Mustermann',
            'email' => 'max.mustermann@domain.de',
            'locale' => 'de',
            'timezone' => 'Europe/Berlin',
        ]);

        $adminRole = Role::where('name', 'admin')->first();
        $guestRole = Role::where('name', 'guests')->first();

        $user->roles()->sync([$guestRole->id => ['automatic' => true], $adminRole->id]);

        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $public_key = $private_key->toPublic();

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = 'johnd';
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'at_hash' => $this->base64url_encode(substr(hash('sha256', 'fake-access-token', true), 0, 16)),
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
            'groups' => ['student', 'staff'],
        ];

        // Sign user info claims
        $userInfoResponse = $this->signClaims($userInfoClaims, $private_key, 'RS256', ['kid' => $kid]);

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [[
            'kid' => $kid,
            ...$public_key->jsonSerialize(),
        ]];

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::response($userInfoResponse, 200, [
                'Content-Type' => 'application/jwt',
            ]),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $header = [
            'Accept-Language' => 'fr',
        ];

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]), $header);

        $this->assertAuthenticated();

        $user = Auth::user();

        // Check if user attributes have been overwritten
        $this->assertEquals('oidc', $user->authenticator);
        $this->assertEquals($sub, $user->external_id);
        $this->assertEquals($firstName, $user->firstname);
        $this->assertEquals($lastName, $user->lastname);
        $this->assertEquals($email, $user->email);

        // Check if default attributes (not provided by oidc) have not been overwritten
        $this->assertEquals('de', $user->locale);
        $this->assertEquals('Europe/Berlin', $user->timezone);

        // Check if automatic roles have been overwritten, but not the manually assigned role
        $this->assertEquals($user->roles()->pluck('name')->toArray(), ['admin', 'user']);
    }

    public function test_callback_with_user_info_unsigned()
    {
        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $public_key = $private_key->toPublic();

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
        ];

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [[
            'kid' => $kid,
            ...$public_key->jsonSerialize(),
        ]];

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::response($userInfoClaims),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));

        $recorded = Http::recorded();

        // Check well-known configuration is fetched
        $this->assertEquals('https://example.org/.well-known/openid-configuration', $recorded[0][0]->url());

        // Check if token is requested using client_secret_basic authentication and the correct parameters
        $this->assertEquals('https://example.org/token', $recorded[1][0]->url());
        $this->assertEquals('Basic ZmFrZS1jbGllbnQtaWQ6ZmFrZS1jbGllbnQtc2VjcmV0', $recorded[1][0]->header('Authorization')[0]);
        $this->assertEquals('authorization_code', $recorded[1][0]->data()['grant_type']);
        $this->assertEquals($code, $recorded[1][0]->data()['code']);
        $this->assertEquals('http://localhost/auth/oidc/callback', $recorded[1][0]->data()['redirect_uri']);

        // Check if JWKS is requested as the token is signed with RS256
        $this->assertEquals('https://example.org/jwks', $recorded[2][0]->url());

        // Check if userinfo is requested with the access token
        $this->assertEquals('https://example.org/userinfo', $recorded[3][0]->url());
        $this->assertEquals('Bearer fake-access-token', $recorded[3][0]->header('Authorization')[0]);

        $response->assertRedirect('http://localhost/external_login');
        $this->assertAuthenticated();

        $this->assertCount(1, \App\Models\Session::all());

        $this->withCookies([session()->getName() => \App\Models\Session::first()->id])->get($response->getTargetUrl());
        $this->assertAuthenticated();

        $user = Auth::user();

        $session = $user->sessions()->first();

        $this->assertEquals($sid, $session->sessionData()->where('key', 'oidc_sid')->first()->value);
        $this->assertEquals($sub, $session->sessionData()->where('key', 'oidc_sub')->first()->value);
    }

    public function test_callback_with_user_info_signed_wrong_sub()
    {
        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $public_key = $private_key->toPublic();

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => 'other-sub', // Check against token substitution attacks
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
        ];

        // Sign user info claims
        $userInfoResponse = $this->signClaims($userInfoClaims, $private_key, 'RS256', ['kid' => $kid]);

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [[
            'kid' => $kid,
            ...$public_key->jsonSerialize(),
        ]];

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::response($userInfoResponse, 200, [
                'Content-Type' => 'application/jwt',
            ]),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));

        $response->assertRedirect('http://localhost/external_login?error=openid_connect_exception');
        $this->assertGuest();
    }

    public function test_callback_with_user_info_unsigned_wrong_sub()
    {
        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $public_key = $private_key->toPublic();

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => 'other-sub', // Check against token substitution attacks
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
        ];

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [[
            'kid' => $kid,
            ...$public_key->jsonSerialize(),
        ]];

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::response($userInfoClaims),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));

        $response->assertRedirect('http://localhost/external_login?error=openid_connect_exception');
        $this->assertGuest();
    }

    public function test_callback_with_user_info_missing_content_type()
    {
        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $public_key = $private_key->toPublic();

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'at_hash' => $this->base64url_encode(substr(hash('sha256', 'fake-access-token', true), 0, 16)),
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [[
            'kid' => $kid,
            ...$public_key->jsonSerialize(),
        ]];

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::response('demo'),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));
        $response->assertRedirect('http://localhost/external_login?error=openid_connect_exception');
        $this->assertGuest();
    }

    public function test_callback_with_user_info_response_error()
    {
        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $public_key = $private_key->toPublic();

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [[
            'kid' => $kid,
            ...$public_key->jsonSerialize(),
        ]];

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::response([
                'error' => 'invalid_token',
                'error_description' => 'The Access Token expired',
            ], 401),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));

        $response->assertRedirect('http://localhost/external_login?error=openid_connect_exception');
        $this->assertGuest();
    }

    public function test_callback_with_user_info_network_error()
    {
        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $public_key = $private_key->toPublic();

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [[
            'kid' => $kid,
            ...$public_key->jsonSerialize(),
        ]];

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::failedConnection(),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));

        $response->assertRedirect('http://localhost/external_login?error=openid_connect_network_exception');
        $this->assertGuest();
    }

    public function test_callback_with_jwks_response_error()
    {
        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response('', 404),
            'https://example.org/token' => Http::response($tokenResponse),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));

        $response->assertRedirect('http://localhost/external_login?error=openid_connect_network_exception');
        $this->assertGuest();
    }

    public function test_callback_with_jwks_network_error()
    {
        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::failedConnection(),
            'https://example.org/token' => Http::response($tokenResponse),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));

        $response->assertRedirect('http://localhost/external_login?error=openid_connect_network_exception');
        $this->assertGuest();
    }

    public function test_callback_with_jwks_invalid_response_error()
    {
        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response('{"keys": "invalid"}'),
            'https://example.org/token' => Http::response($tokenResponse),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));

        $response->assertRedirect('http://localhost/external_login?error=openid_connect_exception');
        $this->assertGuest();
    }

    public function test_callback_with_invalid_iss()
    {
        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $public_key = $private_key->toPublic();

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://idp.com',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
        ];

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [[
            'kid' => $kid,
            ...$public_key->jsonSerialize(),
        ]];

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::response($userInfoClaims),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));

        $response->assertRedirect('http://localhost/external_login?error=openid_connect_exception');
        $this->assertGuest();
    }

    public function test_callback_with_invalid_state()
    {
        // Simulate the state in the session and the return state are different
        Session::put('openid_connect_state', Str::random());

        $response = $this->get(route('auth.oidc.callback', [
            'code' => Str::random(),
            'state' => Str::random(),
        ]));

        $response->assertRedirect('http://localhost/external_login?error=openid_connect_exception');
        $this->assertGuest();
    }

    public function test_callback_with_response_error()
    {
        $response = $this->get(route('auth.oidc.callback', [
            'error' => 'invalid_request',
            'error_description' => 'Unsupported response_type value',
        ]));

        $response->assertRedirect('http://localhost/external_login?error=openid_connect_exception');
        $this->assertGuest();
    }

    public function test_callback_with_network_error()
    {
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::failedConnection(),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));

        $response->assertRedirect('http://localhost/external_login?error=openid_connect_network_exception');
        $this->assertGuest();
    }

    public function test_callback_with_token_response_error()
    {
        // Generate random values for the ID token
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/token' => Http::response([
                'error' => 'invalid_grant',
                'error_description' => 'Invalid authorization code',
            ], 400),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));

        $response->assertRedirect('http://localhost/external_login?error=openid_connect_exception');
        $this->assertGuest();
    }

    public function test_callback_with_token_response_missing_id_token()
    {
        // Generate random values for the ID token
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/token' => Http::response([
                'access_token' => Str::random(),
                'token_type' => 'Bearer',
            ]),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));

        $response->assertRedirect('http://localhost/external_login?error=openid_connect_exception');
        $this->assertGuest();
    }

    public function test_callback_with_token_response_missing_access_token()
    {
        // Generate random values for the ID token
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/token' => Http::response([
                'id_token' => Str::random(),
                'token_type' => 'Bearer',
            ]),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));

        $response->assertRedirect('http://localhost/external_login?error=openid_connect_exception');
        $this->assertGuest();
    }

    public function test_callback_with_token_response_missing_token_type()
    {
        // Generate random values for the ID token
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/token' => Http::response([
                'id_token' => Str::random(),
                'access_token' => Str::random(),
            ]),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));

        $response->assertRedirect('http://localhost/external_login?error=openid_connect_exception');
        $this->assertGuest();
    }

    public function test_callback_with_token_response_invalid_token_type()
    {
        // Generate random values for the ID token
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/token' => Http::response([
                'id_token' => Str::random(),
                'access_token' => Str::random(),
                'token_type' => 'InvalidTokenType',
            ]),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));

        $response->assertRedirect('http://localhost/external_login?error=openid_connect_exception');
        $this->assertGuest();
    }

    public function test_callback_with_token_network_error()
    {
        // Generate random values for the ID token
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/token' => Http::failedConnection(),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));

        $response->assertRedirect('http://localhost/external_login?error=openid_connect_network_exception');
        $this->assertGuest();
    }

    public function test_callback_with_missing_attributes()
    {
        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $public_key = $private_key->toPublic();

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
        ];

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [[
            'kid' => $kid,
            ...$public_key->jsonSerialize(),
        ]];

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::response($userInfoClaims),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));

        $response->assertRedirect('http://localhost/external_login?error=missing_attributes');
        $this->assertGuest();
    }

    public function test_redirect_and_callback()
    {
        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $public_key = $private_key->toPublic();

        $kid = Str::random();

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [[
            'kid' => $kid,
            ...$public_key->jsonSerialize(),
        ]];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
        ]);

        $response = $this->get(route('auth.oidc.redirect', ['redirect' => '/rooms/abc-123-def']));
        $targetUrl = $response->getTargetUrl();

        $query = parse_url($targetUrl, PHP_URL_QUERY);
        $queryParams = [];
        parse_str($query, $queryParams);
        $state = $queryParams['state'];
        $nonce = $queryParams['nonce'];

        // Generate random values for the ID token
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
        ];

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        $code = Str::random();

        Http::fake([
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::response($userInfoClaims),
        ]);

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));
        $this->assertAuthenticated();

        $redirectUrl = $response->getTargetUrl();

        $redirectUrlParsed = parse_url($redirectUrl);
        $queryParams = [];
        parse_str($redirectUrlParsed['query'], $queryParams);
        $this->assertEquals('/rooms/abc-123-def', $queryParams['redirect']);
    }

    public function test_rp_initiated_logout_missing_end_session_endpoint()
    {
        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $public_key = $private_key->toPublic();

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'at_hash' => $this->base64url_encode(substr(hash('sha256', 'fake-access-token', true), 0, 16)),
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
            'groups' => ['student', 'staff'],
        ];

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [[
            'kid' => $kid,
            ...$public_key->jsonSerialize(),
        ]];

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::response($userInfoClaims),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $header = [
            'Accept-Language' => 'fr',
        ];

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]), $header);

        $this->assertAuthenticated();

        $header['referer'] = 'http://localhost';

        $response = $this->postJson(route('api.v1.logout'), [], $header);
        $this->assertGuest();
        $response->assertJsonPath('redirect', false);

    }

    public function test_rp_initiated_logout()
    {
        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $public_key = $private_key->toPublic();

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'at_hash' => $this->base64url_encode(substr(hash('sha256', 'fake-access-token', true), 0, 16)),
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
            'groups' => ['student', 'staff'],
        ];

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [[
            'kid' => $kid,
            ...$public_key->jsonSerialize(),
        ]];

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        $discovery = $this->discovery;
        $discovery['end_session_endpoint'] = 'https://example.org/logout';

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::response($userInfoClaims),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $header = [
            'Accept-Language' => 'fr',
        ];

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]), $header);

        $this->assertAuthenticated();

        $header['referer'] = 'http://localhost';

        $response = $this->postJson(route('api.v1.logout'), [], $header);
        $this->assertGuest();

        $redirectUrl = parse_url($response->json('redirect'));

        $this->assertEquals('https', $redirectUrl['scheme']);
        $this->assertEquals('example.org', $redirectUrl['host']);
        $this->assertEquals('/logout', $redirectUrl['path']);

        $queryParams = [];
        parse_str($redirectUrl['query'], $queryParams);

        $this->assertEquals('http://localhost/logout', $queryParams['post_logout_redirect_uri']);
        $this->assertEquals($idToken, $queryParams['id_token_hint']);
    }

    public function test_rp_initiated_logout_network_error()
    {
        $user = User::factory()->create(['authenticator' => 'oidc']);

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::failedConnection(),
        ]);

        $header['referer'] = 'http://localhost';
        $response = $this->actingAs($user)
            ->withSession(['oidc_id_token' => 'fake-id-token'])
            ->postJson(route('api.v1.logout'), [], $header);
        $this->assertGuest();

        $response->assertJsonPath('redirect', false);
    }

    public function test_back_channel_logout_with_sub()
    {
        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $public_key = $private_key->toPublic();

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'at_hash' => $this->base64url_encode(substr(hash('sha256', 'fake-access-token', true), 0, 16)),
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
            'groups' => ['student', 'staff'],
        ];

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [[
            'kid' => $kid,
            ...$public_key->jsonSerialize(),
        ]];

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        $discovery = $this->discovery;
        $discovery['end_session_endpoint'] = 'https://example.org/logout';

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::response($userInfoClaims),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $header = [
            'Accept-Language' => 'fr',
        ];

        // Check no session exists yet
        $this->assertCount(0, \App\Models\Session::all());

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]), $header);
        $response = $this->withCookies([session()->getName() => \App\Models\Session::first()->id])->get($response->getTargetUrl(), $header);
        $this->assertAuthenticated();

        Auth::logout();

        // Check session still exists
        $this->assertCount(1, \App\Models\Session::all());

        // Create logout token
        $logoutToken = $this->signClaims([
            'iss' => 'https://example.org',
            'sub' => $sub,
            'aud' => 'fake-client-id',
            'iat' => time(),
            'exp' => time() + 60,
            'jti' => Str::random(),
            'events' => json_decode('{"http://schemas.openid.net/event/backchannel-logout": {}}'),
        ], $private_key, 'RS256', ['kid' => $kid]);

        // Simulate back-channel logout
        $this->post(route('auth.oidc.logout'), ['logout_token' => $logoutToken])
            ->assertSuccessful();

        // Check if session is terminated
        $this->assertCount(0, \App\Models\Session::all());

        // Try to send it again, it should be rejected due to the jti already being used
        $this->post(route('auth.oidc.logout'), ['logout_token' => $logoutToken])
            ->assertStatus(400);
    }

    public function test_back_channel_logout_with_sid()
    {
        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $public_key = $private_key->toPublic();

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'at_hash' => $this->base64url_encode(substr(hash('sha256', 'fake-access-token', true), 0, 16)),
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
            'groups' => ['student', 'staff'],
        ];

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [[
            'kid' => $kid,
            ...$public_key->jsonSerialize(),
        ]];

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        $discovery = $this->discovery;
        $discovery['end_session_endpoint'] = 'https://example.org/logout';

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::response($userInfoClaims),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $header = [
            'Accept-Language' => 'fr',
        ];

        // Check no session exists yet
        $this->assertCount(0, \App\Models\Session::all());

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]), $header);
        $response = $this->withCookies([session()->getName() => \App\Models\Session::first()->id])->get($response->getTargetUrl(), $header);
        $this->assertAuthenticated();

        Auth::logout();

        // Check session still exists
        $this->assertCount(1, \App\Models\Session::all());

        // Create logout token
        $logoutToken = $this->signClaims([
            'iss' => 'https://example.org',
            'sid' => $sid,
            'aud' => 'fake-client-id',
            'iat' => time(),
            'exp' => time() + 60,
            'jti' => Str::random(),
            'events' => json_decode('{"http://schemas.openid.net/event/backchannel-logout": {}}'),
        ], $private_key, 'RS256', ['kid' => $kid]);

        // Simulate back-channel logout
        $this->post(route('auth.oidc.logout'), ['logout_token' => $logoutToken])
            ->assertSuccessful();

        // Check if session is terminated
        $this->assertCount(0, \App\Models\Session::all());
    }

    public function test_back_channel_logout_with_nonce()
    {
        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $public_key = $private_key->toPublic();

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'at_hash' => $this->base64url_encode(substr(hash('sha256', 'fake-access-token', true), 0, 16)),
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
            'groups' => ['student', 'staff'],
        ];

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [[
            'kid' => $kid,
            ...$public_key->jsonSerialize(),
        ]];

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        $discovery = $this->discovery;
        $discovery['end_session_endpoint'] = 'https://example.org/logout';

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::response($userInfoClaims),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $header = [
            'Accept-Language' => 'fr',
        ];

        // Check no session exists yet
        $this->assertCount(0, \App\Models\Session::all());

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]), $header);
        $response = $this->withCookies([session()->getName() => \App\Models\Session::first()->id])->get($response->getTargetUrl(), $header);
        $this->assertAuthenticated();

        Auth::logout();

        // Check session still exists
        $this->assertCount(1, \App\Models\Session::all());

        // Create logout token
        $logoutToken = $this->signClaims([
            'iss' => 'https://example.org',
            'sid' => $sid,
            'aud' => 'fake-client-id',
            'iat' => time(),
            'exp' => time() + 60,
            'jti' => Str::random(),
            'nonce' => $nonce,
            'events' => json_decode('{"http://schemas.openid.net/event/backchannel-logout": {}}'),
        ], $private_key, 'RS256', ['kid' => $kid]);

        // Simulate back-channel logout
        $this->post(route('auth.oidc.logout'), ['logout_token' => $logoutToken])
            ->assertStatus(400);

        // Check if session is not terminated
        $this->assertCount(1, \App\Models\Session::all());
    }

    public function test_back_channel_logout_without_sid_and_sub()
    {
        // Create a new RSA key pair for signing the ID token
        $private_key = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $public_key = $private_key->toPublic();

        // Generate random values for the ID token
        $kid = Str::random();
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        // Create claims for the ID token
        $claims = [
            'exp' => time() + 60,
            'iat' => time(),
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'at_hash' => $this->base64url_encode(substr(hash('sha256', 'fake-access-token', true), 0, 16)),
            'sub' => $sub,
            'sid' => $sid,
            'nonce' => $nonce,
        ];

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
            'groups' => ['student', 'staff'],
        ];

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [[
            'kid' => $kid,
            ...$public_key->jsonSerialize(),
        ]];

        $tokenResponse = [
            'access_token' => 'fake-access-token',
            'token_type' => 'Bearer',
            'id_token' => $idToken,
        ];

        $discovery = $this->discovery;
        $discovery['end_session_endpoint'] = 'https://example.org/logout';

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::response($userInfoClaims),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $header = [
            'Accept-Language' => 'fr',
        ];

        // Check no session exists yet
        $this->assertCount(0, \App\Models\Session::all());

        $response = $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]), $header);
        $response = $this->withCookies([session()->getName() => \App\Models\Session::first()->id])->get($response->getTargetUrl(), $header);
        $this->assertAuthenticated();

        Auth::logout();

        // Check session still exists
        $this->assertCount(1, \App\Models\Session::all());

        // Create logout token
        $logoutToken = $this->signClaims([
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'iat' => time(),
            'exp' => time() + 60,
            'jti' => Str::random(),
            'events' => json_decode('{"http://schemas.openid.net/event/backchannel-logout": {}}'),
        ], $private_key, 'RS256', ['kid' => $kid]);

        // Simulate back-channel logout
        $this->post(route('auth.oidc.logout'), ['logout_token' => $logoutToken])
            ->assertStatus(400);

        // Check if session is not terminated
        $this->assertCount(1, \App\Models\Session::all());
    }

    public function test_back_channel_logout_without_logout_token()
    {
        // Simulate back-channel logout
        $this->post(route('auth.oidc.logout'))
            ->assertStatus(400);
    }

    public function test_back_channel_logout_disabled()
    {
        Config::set('services.oidc.enabled', false);
        $this->post(route('auth.oidc.logout'))
            ->assertNotFound();
    }
}
