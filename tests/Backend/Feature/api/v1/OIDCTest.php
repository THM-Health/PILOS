<?php

declare(strict_types=1);

namespace Tests\Backend\Feature\api\v1;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Jose\Component\KeyManagement\JWKFactory;
use Spatie\Image\Image;
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
     * Mocks OIDC Server by stubbing HTTP requests
     * Used to reduce code duplication in tests where mainly other aspects around the authentication flow are tested
     *
     * @param  string  $sub  Subject Identifier
     * @param  string  $sid  Session ID
     * @param  string  $nonce  Nonce
     * @param  array  $userInfoClaims  Additional user info claims
     * @param  array  $discovery  Additional discovery document attributes
     * @return array Associated array containing id_token, private_key and kid
     */
    public function fake_oidc_server(string $sub, string $sid, string $nonce, array $userInfoClaims, array $discovery = [])
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

        $userInfoClaims = array_merge(
            [
                'iss' => 'https://example.org',
                'aud' => 'fake-client-id',
            ], $userInfoClaims);

        // Create id token
        $idToken = $this->signClaims($claims, $private_key, 'RS256', ['kid' => $kid]);

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

        $discovery = array_merge($this->discovery, $discovery);

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
            'https://example.org/token' => Http::response($tokenResponse),
            'https://example.org/userinfo' => Http::response($userInfoResponse, 200, [
                'Content-Type' => 'application/jwt',
            ]),
        ]);

        return [
            'id_token' => $idToken,
            'private_key' => $private_key,
            'kid' => $kid,
        ];
    }

    /**
     * Setup resources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        config([
            'services.oidc.enabled' => true,
            'services.oidc.client_id' => 'fake-client-id',
            'services.oidc.client_secret' => 'fake-client-secret',
            'services.oidc.issuer' => 'https://example.org',
            'services.oidc.scopes' => ['profile', 'email'],

            'services.oidc.leeway' => 60,
            'services.oidc.timeout' => 10,
            'services.oidc.cache_config_max_age' => 0,
            'services.oidc.cache_jwks_max_age' => 0,

            'services.oidc.mapping' => json_decode($this->mapping),
            'app.enabled_locales' => ['de' => ['name' => 'Deutsch', 'dateTimeFormat' => []], 'en' => ['name' => 'English', 'dateTimeFormat' => []], 'fr' => ['name' => 'Français', 'dateTimeFormat' => []]],
        ]);

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
        config(['services.oidc.enabled' => false]);
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

        $this->assertEquals(Session::get('openid_connect_nonce'), $queryParams['nonce']);
        $this->assertEquals(Session::get('openid_connect_state'), $queryParams['state']);

    }

    /**
     * Test that the redirect route can be accessed by logged-in users
     *
     * @return void
     */
    public function test_redirect_route_as_logged_in_user()
    {
        $user = User::factory()->create();

        // Check without redirect url
        $response = $this->actingAs($user)->get(route('auth.oidc.redirect'));
        $response->assertRedirect('http://localhost/external_login?no_message=1');

        // Check with redirect url
        $response = $this->actingAs($user)->get(route('auth.oidc.redirect', ['redirect' => '/rooms/abc-123-def']));
        $response->assertRedirect('http://localhost/external_login?no_message=1&redirect=%2Frooms%2Fabc-123-def');
    }

    public function test_redirect_route_invalid_parameter()
    {
        Log::swap(new LogFake);

        // Redirect parameter empty
        $response = $this->get(route('auth.oidc.redirect', ['redirect' => '']));
        $response->assertRedirect('http://localhost/external_login?error=invalid_request');

        // Redirect parameter array
        $response = $this->get(route('auth.oidc.redirect', ['redirect' => ['foo', 'bar']]));
        $response->assertRedirect('http://localhost/external_login?error=invalid_request');

        Log::assertLoggedTimes(
            fn (LogEntry $log) => $log->level == 'error'
                && $log->message == 'OIDC login redirect failed: invalid request parameter(s): redirect'
                && $log->context['ip'] == '127.0.0.1'
                && $log->context['current-user'] == 'guest',
            2
        );
    }

    /**
     * Test that the callback route is disabled if disabled in env
     *
     * @return void
     */
    public function test_callback_route_disabled()
    {
        config(['services.oidc.enabled' => false]);
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
        $response->assertRedirect('http://localhost/rooms');
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

    public function test_callback_route_invalid_parameter()
    {
        Log::swap(new LogFake);

        $params = ['code', 'state', 'error', 'error_description'];

        foreach ($params as $param) {
            // Parameter empty
            $response = $this->get(route('auth.oidc.callback', [$param => '']));
            $response->assertRedirect('http://localhost/external_login?error=invalid_request');

            // Parameter array
            $response = $this->get(route('auth.oidc.callback', [$param => ['foo', 'bar']]));
            $response->assertRedirect('http://localhost/external_login?error=invalid_request');

            Log::assertLoggedTimes(
                fn (LogEntry $log) => $log->level == 'error'
                    && $log->message == 'OIDC login callback failed: invalid request parameter(s): '.$param
                    && $log->context['ip'] == '127.0.0.1'
                    && $log->context['current-user'] == 'guest',
                2
            );
        }
    }

    public function test_callback_with_user_info_signed()
    {
        $this->generalSettings->default_timezone = 'Europe/Paris';
        $this->generalSettings->save();

        // Generate random values for the ID token
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        $userInfoClaims = [
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
            'groups' => ['student', 'staff'],
        ];

        $this->fake_oidc_server($sub, $sid, $nonce, $userInfoClaims);

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

    public function test_profile_image()
    {
        Storage::fake('public');

        $mapping = json_decode($this->mapping);
        $mapping->attributes->image = 'picture';

        config([
            'services.oidc.mapping' => $mapping,
            'services.oidc.profile_image_trusted_hosts' => ['example.org'],
        ]);

        // Generate random values
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();
        $picture = 'https://example.org/picture.jpg';

        $userInfoClaims = [
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
            'picture' => $picture,
        ];

        $this->fake_oidc_server($sub, $sid, $nonce, $userInfoClaims);

        // Profile picture
        $pathProfileImage1 = __DIR__.'/../../../Fixtures/profileImage-1.jpg';
        $pathProfileImage2 = __DIR__.'/../../../Fixtures/profileImage-2.jpg';
        Http::fake([
            'https://example.org/picture.jpg' => Http::sequence()
                ->push(file_get_contents($pathProfileImage1), 200, [
                    'Content-Type' => 'image/jpeg',
                    'Content-Length' => filesize($pathProfileImage1),
                    'Content-Disposition' => 'inline;filename="profile-image.jpg"',
                ])
                ->push(file_get_contents($pathProfileImage2), 200, [
                    'Content-Type' => 'image/jpeg',
                    'Content-Length' => filesize($pathProfileImage2),
                    'Content-Disposition' => 'inline;filename="profile-image.jpg"',
                ])
                ->push(file_get_contents($pathProfileImage2), 200, [
                    'Content-Type' => 'image/jpeg',
                    'Content-Length' => filesize($pathProfileImage2),
                    'Content-Disposition' => 'inline;filename="profile-image.jpg"',
                ]),

        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));
        $this->assertAuthenticated();

        $this->assertAuthenticated();
        $user = Auth::user();

        // Check external image hash and image are set
        $this->assertEquals('346f8f4d7df6d16aac328afb8d2714189c1c70ceaba165dfde005b56846382e9', $user->external_image_hash);

        // Check image is cropped
        $cropped = Image::load(Storage::disk('public')->path($user->image));
        $croppedContent = Storage::disk('public')->get($user->image);
        $filePath = $user->image;
        $this->assertEquals(100, $cropped->getWidth());
        $this->assertEquals(100, $cropped->getHeight());
        $croppedHash = hash_file('sha256', Storage::disk('public')->path($user->image));

        // Logout
        Auth::logout();

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));
        $this->assertAuthenticated();
        $user->refresh();

        // Check external image hash and image have changed
        $this->assertEquals('7bcca0ca9be5eee6e71cac33697835384b6b76d3cfc3298e63f42b5289e6788f', $user->external_image_hash);
        // Check old image is deleted
        $this->assertFalse(Storage::disk('public')->exists($filePath));

        // Check image is cropped
        $cropped2 = Image::load(Storage::disk('public')->path($user->image));
        $this->assertEquals(100, $cropped2->getWidth());
        $this->assertEquals(100, $cropped2->getHeight());
        $cropped2Hash = hash_file('sha256', Storage::disk('public')->path($user->image));
        $this->assertNotEquals($croppedHash, $cropped2Hash);

        // Logout
        Auth::logout();

        // To tests this, we manually replace the stored image to see if it is not overwritten
        Storage::disk('public')->put($user->image, $croppedContent);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));
        $this->assertAuthenticated();
        $user->refresh();

        // Check external image hash and image are not updated
        $this->assertEquals('7bcca0ca9be5eee6e71cac33697835384b6b76d3cfc3298e63f42b5289e6788f', $user->external_image_hash);
        $cropped3Hash = hash_file('sha256', Storage::disk('public')->path($user->image));
        $this->assertEquals($croppedHash, $cropped3Hash);
    }

    public function test_profile_image_cleared()
    {
        Storage::fake('public');

        // Profile picture
        $pathProfileImage1 = __DIR__.'/../../../Fixtures/profileImage-1.jpg';
        Storage::disk('public')->copy($pathProfileImage1, 'profile_images/test.jpg');
        $path = Storage::disk('public')->path('profile_images/test.jpg');

        $user = User::factory()->create([
            'authenticator' => 'oidc',
            'external_id' => 'johnd',
            'firstname' => 'Max',
            'lastname' => 'Mustermann',
            'email' => 'max.mustermann@domain.de',
            'locale' => 'de',
            'timezone' => 'Europe/Berlin',
            'external_image_hash' => '346f8f4d7df6d16aac328afb8d2714189c1c70ceaba165dfde005b56846382e9',
            'image' => $path,
        ]);

        $mapping = json_decode($this->mapping);
        $mapping->attributes->image = 'picture';

        config([
            'services.oidc.mapping' => $mapping,
            'services.oidc.profile_image_trusted_hosts' => ['example.org'],
        ]);

        // Generate random values
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = 'johnd';
        $sid = $this->faker->uuid();

        $userInfoClaims = [
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
        ];

        $this->fake_oidc_server($sub, $sid, $nonce, $userInfoClaims);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));
        $this->assertAuthenticated();

        $this->assertAuthenticated();
        $user->refresh();

        // Check image is deleted
        $this->assertNull($user->external_image_hash);
        $this->assertNull($user->image);

        $this->assertFalse(Storage::disk('public')->exists($path));

    }

    public function test_profile_image_untrusted_host()
    {
        Storage::fake('public');
        Log::swap(new LogFake);

        $mapping = json_decode($this->mapping);
        $mapping->attributes->image = 'picture';

        config([
            'services.oidc.mapping' => $mapping,
            'services.oidc.profile_image_trusted_hosts' => ['example.com'],
        ]);

        // Generate random values
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();
        $picture = 'https://example.org/picture.jpg';

        $userInfoClaims = [
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
            'picture' => $picture,
        ];

        $this->fake_oidc_server($sub, $sid, $nonce, $userInfoClaims);

        // Profile picture
        $pathProfileImage1 = __DIR__.'/../../../Fixtures/profileImage-1.jpg';
        Http::fake([
            'https://example.org/picture.jpg' => Http::response(file_get_contents($pathProfileImage1), 200, [
                'Content-Type' => 'image/jpeg',
                'Content-Length' => filesize($pathProfileImage1),
                'Content-Disposition' => 'inline;filename="profile-image.jpg"',
            ]),
        ]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));
        $this->assertAuthenticated();

        $this->assertAuthenticated();
        $user = Auth::user();

        // Check image is not set
        $this->assertNull($user->external_image_hash);
        $this->assertNull($user->image);

        // Check log file
        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'error'
                && $log->message == 'Failed to save image for user ({user}): {error}'
                && $log->context['user'] == $user->getLogLabel()
                && $log->context['ip'] == '127.0.0.1'
                && $log->context['current-user'] == 'guest'
                && $log->context['error'] == 'Rejected host example.org. Not in trusted hosts for profile images.'
        );

        // Logout
        Auth::logout();

        // Test with empty list of trusted hosts
        config(['services.oidc.profile_image_trusted_hosts' => []]);

        // Simulate the state and nonce have been set in the session
        Session::put('openid_connect_state', $state);
        Session::put('openid_connect_nonce', $nonce);

        $this->get(route('auth.oidc.callback', [
            'code' => $code,
            'state' => $state,
        ]));
        $this->assertAuthenticated();

        $this->assertAuthenticated();
        $user->refresh();

        // Check image is not set
        $this->assertNull($user->external_image_hash);
        $this->assertNull($user->image);

        // Check log file
        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'error'
                && $log->message == 'Failed to save image for user ({user}): {error}'
                && $log->context['user'] == $user->getLogLabel()
                && $log->context['ip'] == '127.0.0.1'
                && $log->context['current-user'] == 'guest'
                && $log->context['error'] == 'Rejected host example.org. No trusted hosts configured for profile images.'
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

        // Generate random values for the ID token
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = 'johnd';
        $sid = $this->faker->uuid();

        $userInfoClaims = [
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
            'groups' => ['student', 'staff'],
        ];

        $this->fake_oidc_server($sub, $sid, $nonce, $userInfoClaims);

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
        // Generate random values for the ID token
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        $userInfoClaims = [
            'sub' => $sub,
            'given_name' => $firstName,
        ];

        $this->fake_oidc_server($sub, $sid, $nonce, $userInfoClaims);

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
        $response->assertRedirect('http://localhost/external_login?redirect=%2Frooms%2Fabc-123-def');
        $this->assertAuthenticated();
    }

    public function test_rp_initiated_logout_missing_end_session_endpoint()
    {
        // Generate random values for the ID token
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
            'groups' => ['student', 'staff'],
        ];

        $this->fake_oidc_server($sub, $sid, $nonce, $userInfoClaims);

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
        // Generate random values for the ID token
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
            'groups' => ['student', 'staff'],
        ];

        $discovery = ['end_session_endpoint' => 'https://example.org/logout'];

        ['id_token' => $idToken] = $this->fake_oidc_server($sub, $sid, $nonce, $userInfoClaims, $discovery);

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
        // Generate random values for the ID token
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
            'groups' => ['student', 'staff'],
        ];

        $discovery = ['end_session_endpoint' => 'https://example.org/logout'];

        ['kid' => $kid, 'private_key' => $private_key] = $this->fake_oidc_server($sub, $sid, $nonce, $userInfoClaims, $discovery);

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
        // Generate random values for the ID token
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
            'groups' => ['student', 'staff'],
        ];

        $discovery = ['end_session_endpoint' => 'https://example.org/logout'];

        ['kid' => $kid, 'private_key' => $private_key] = $this->fake_oidc_server($sub, $sid, $nonce, $userInfoClaims, $discovery);

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
        // Generate random values for the ID token
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
            'groups' => ['student', 'staff'],
        ];

        $discovery = ['end_session_endpoint' => 'https://example.org/logout'];

        ['kid' => $kid, 'private_key' => $private_key] = $this->fake_oidc_server($sub, $sid, $nonce, $userInfoClaims, $discovery);

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
        // Generate random values for the ID token
        $code = Str::random();
        $nonce = Str::random();
        $state = Str::random();
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $email = $this->faker->email();
        $sub = $this->faker->uuid();
        $sid = $this->faker->uuid();

        $userInfoClaims = [
            'iss' => 'https://example.org',
            'aud' => 'fake-client-id',
            'sub' => $sub,
            'given_name' => $firstName,
            'family_name' => $lastName,
            'email' => $email,
            'groups' => ['student', 'staff'],
        ];

        $discovery = ['end_session_endpoint' => 'https://example.org/logout'];

        ['kid' => $kid, 'private_key' => $private_key] = $this->fake_oidc_server($sub, $sid, $nonce, $userInfoClaims, $discovery);

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
        config(['services.oidc.enabled' => false]);
        $this->post(route('auth.oidc.logout'))
            ->assertNotFound();
    }
}
