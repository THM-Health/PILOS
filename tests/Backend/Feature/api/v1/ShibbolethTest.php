<?php

namespace Tests\Backend\Feature\api\v1;

use App\Models\Role;
use App\Models\Session;
use App\Models\User;
use Carbon\Carbon;
use Config;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Auth;
use Tests\Backend\TestCase;

class ShibbolethTest extends TestCase
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
        Config::set('services.shibboleth.enabled', true);
        Config::set('services.shibboleth.mapping', json_decode($this->mapping));
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
        Config::set('services.shibboleth.enabled', false);
        $response = $this->get(route('auth.shibboleth.redirect'));
        $response->assertNotFound();
    }

    /**
     * Test that the redirect route is returning the protected shibboleth callback route with the redirect parameter
     *
     * @return void
     */
    public function test_redirect_route()
    {
        $response = $this->get(route('auth.shibboleth.redirect', ['redirect' => '/rooms/abc-123-def']));
        $response->assertRedirectToRoute('auth.shibboleth.callback', ['redirect' => '/rooms/abc-123-def']);
    }

    /**
     * Test that the callback route is disabled if disabled in env
     *
     * @return void
     */
    public function test_callback_route_disabled()
    {
        Config::set('services.shibboleth.enabled', false);
        $response = $this->get(route('auth.shibboleth.callback'));
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
        $response = $this->actingAs($user)->get(route('auth.shibboleth.callback'));
        $response->assertStatus(420);
    }

    /**
     * Test callback route with no headers
     *
     * @return void
     */
    public function test_callback_route_with_no_headers()
    {
        $response = $this->get(route('auth.shibboleth.callback'));
        $response->assertRedirect('/external_login?error=missing_attributes');
    }

    /**
     * Test user creation and role mapping with all required attributes
     *
     * @return void
     */
    public function test_callback_route_with_valid_data()
    {
        $this->generalSettings->default_timezone = 'Europe/Paris';
        $this->generalSettings->save();

        $header = [
            'Accept-Language' => 'fr',
            'shib-session-id' => '_855fe7fbe56c664a6fad794c65243ec6',
            'shib-session-expires' => Carbon::now()->addHours(12)->timestamp,
            'principalname' => 'johnd@university.org',
            'givenname' => 'John',
            'surname' => 'Doe',
            'mail' => 'john.doe@domain.tld',
            'scoped-affiliation' => 'student@university.org;staff@university.org',
        ];

        $response = $this->get(route('auth.shibboleth.callback'), $header);
        $response->assertRedirect('/external_login');
        $this->assertAuthenticated();

        $user = Auth::user();

        $this->assertEquals('shibboleth', $user->authenticator);
        $this->assertEquals('johnd@university.org', $user->external_id);
        $this->assertEquals('John', $user->firstname);
        $this->assertEquals('Doe', $user->lastname);
        $this->assertEquals('john.doe@domain.tld', $user->email);
        $this->assertEquals('fr', $user->locale);
        $this->assertEquals('Europe/Paris', $user->timezone);

        $this->assertEquals($user->roles()->pluck('name')->toArray(), ['user']);
    }

    /**
     * Test login with a user that has logged in before
     *
     * Check if some attributes have been overwritten and some have not
     * Check if role mapping is applied, but manually assigned roles are not overwritten
     *
     * @return void
     */
    public function test_callback_route_existing_user()
    {
        $user = User::factory()->create([
            'authenticator' => 'shibboleth',
            'external_id' => 'johnd@university.org',
            'firstname' => 'Max',
            'lastname' => 'Mustermann',
            'email' => 'max.mustermann@domain.de',
            'locale' => 'de',
            'timezone' => 'Europe/Berlin',
        ]);

        $adminRole = Role::where('name', 'admin')->first();
        $guestRole = Role::where('name', 'guests')->first();

        $user->roles()->sync([$guestRole->id => ['automatic' => true], $adminRole->id]);

        $this->generalSettings->default_timezone = 'Europe/Paris';
        $this->generalSettings->save();

        $header = [
            'Accept-Language' => 'fr',
            'shib-session-id' => '_855fe7fbe56c664a6fad794c65243ec6',
            'shib-session-expires' => Carbon::now()->addHours(12)->timestamp,
            'principalname' => 'johnd@university.org',
            'givenname' => 'John',
            'surname' => 'Doe',
            'mail' => 'john.doe@domain.tld',
            'scoped-affiliation' => 'student@university.org;staff@university.org',
        ];

        $response = $this->get(route('auth.shibboleth.callback'), $header);
        $response->assertRedirect('/external_login');
        $this->assertAuthenticated();

        $user = Auth::user();

        // Check if user attributes have been overwritten
        $this->assertEquals('shibboleth', $user->authenticator);
        $this->assertEquals('johnd@university.org', $user->external_id);
        $this->assertEquals('John', $user->firstname);
        $this->assertEquals('Doe', $user->lastname);
        $this->assertEquals('john.doe@domain.tld', $user->email);

        // Check if default attributes (not provided by shibboleth) have not been overwritten
        $this->assertEquals('de', $user->locale);
        $this->assertEquals('Europe/Berlin', $user->timezone);

        // Check if automatic roles have been overwritten, but not the manually assigned role
        $this->assertEquals($user->roles()->pluck('name')->toArray(), ['admin', 'user']);
    }

    /**
     * Test login with the same shibboleth session id (no other application session exists anymore)
     *
     * @return void
     */
    public function test_login_with_same_session_id()
    {
        $header = [
            'Accept-Language' => 'fr',
            'shib-session-id' => '_855fe7fbe56c664a6fad794c65243ec6',
            'shib-session-expires' => Carbon::now()->addHours(12)->timestamp,
            'principalname' => 'johnd@university.org',
            'givenname' => 'John',
            'surname' => 'Doe',
            'mail' => 'john.doe@domain.tld',
            'scoped-affiliation' => 'student@university.org;staff@university.org',
        ];

        $response = $this->get(route('auth.shibboleth.callback'), $header);
        $response->assertRedirect('/external_login');
        $this->assertAuthenticated();

        $user = Auth::user();

        Auth::logout();

        $response = $this->get(route('auth.shibboleth.callback'), $header);
        $response->assertRedirect('/Shibboleth.sso/Logout?return=http://localhost/external_login?error=shibboleth_session_duplicate_exception');
        $this->assertGuest();
    }

    /**
     * Test login trying to create two sessions with the same shibboleth session id
     *
     * @return void
     */
    public function test_login_simultaneous_session_id()
    {
        $header = [
            'Accept-Language' => 'fr',
            'shib-session-id' => '_855fe7fbe56c664a6fad794c65243ec6',
            'shib-session-expires' => Carbon::now()->addHours(12)->timestamp,
            'principalname' => 'johnd@university.org',
            'givenname' => 'John',
            'surname' => 'Doe',
            'mail' => 'john.doe@domain.tld',
            'scoped-affiliation' => 'student@university.org;staff@university.org',
        ];

        $this->assertCount(0, Session::all());

        $response = $this->get(route('auth.shibboleth.callback'), $header);

        $this->assertAuthenticated();

        $this->assertCount(1, Session::all());

        $response = $this->withCookies([session()->getName() => Session::first()->id])->get($response->getTargetUrl(), $header);
        $this->assertAuthenticated();

        $user = Auth::user();

        $session = $user->sessions()->first();
        $sessionData = $session->sessionData()->where('key', 'shibboleth_session_id')->first();
        $this->assertNotNull($sessionData);

        Auth::logout();

        $response = $this->get(route('auth.shibboleth.callback'), $header);
        $response->assertRedirect('/Shibboleth.sso/Logout?return=http://localhost/external_login?error=shibboleth_session_duplicate_exception');
        $this->assertGuest();

        $this->assertCount(0, Session::all());
    }

    /**
     * Test changing shibboleth session id after login
     *
     * @return void
     */
    public function test_changing_shibb_session()
    {
        $header = [
            'Accept-Language' => 'fr',
            'shib-session-id' => '_855fe7fbe56c664a6fad794c65243ec6',
            'shib-session-expires' => Carbon::now()->addHours(12)->timestamp,
            'principalname' => 'johnd@university.org',
            'givenname' => 'John',
            'surname' => 'Doe',
            'mail' => 'john.doe@domain.tld',
            'scoped-affiliation' => 'student@university.org;staff@university.org',
        ];

        $response = $this->get(route('auth.shibboleth.callback'), $header);
        $this->withCookies([session()->getName() => Session::first()->id])->get($response->getTargetUrl(), $header);
        $this->assertAuthenticated();

        // Check with same session id
        $response = $this->getJson(route('api.v1.currentUser'), $header);
        $response->assertSuccessful();

        // Check with different session id
        $header['shib-session-id'] = '_855fe7fbe56c664a6fad794c65243ec7';
        $response = $this->getJson(route('api.v1.currentUser'), $header);
        $response->assertRedirect('/Shibboleth.sso/Logout?return=http://localhost/logout?message=session_expired');
        $this->assertGuest();
    }

    /**
     * Test if shib. session is not validated on subsequent requests if middleware is disabled
     *
     * @return void
     */
    public function test_changing_shibb_session_with_middleware_disabled()
    {
        config(['services.shibboleth.session_check_middleware_enabled' => false]);

        $header = [
            'Accept-Language' => 'fr',
            'shib-session-id' => '_855fe7fbe56c664a6fad794c65243ec6',
            'shib-session-expires' => Carbon::now()->addHours(12)->timestamp,
            'principalname' => 'johnd@university.org',
            'givenname' => 'John',
            'surname' => 'Doe',
            'mail' => 'john.doe@domain.tld',
            'scoped-affiliation' => 'student@university.org;staff@university.org',
        ];

        $response = $this->get(route('auth.shibboleth.callback'), $header);
        $this->withCookies([session()->getName() => Session::first()->id])->get($response->getTargetUrl(), $header);
        $this->assertAuthenticated();

        // Check with same session id
        $response = $this->getJson(route('api.v1.currentUser'), $header);
        $response->assertSuccessful();

        // Check without shib. session id, user should still be authenticated
        unset($header['shib-session-id']);
        $response = $this->getJson(route('api.v1.currentUser'), $header);
        $response->assertSuccessful();
        $this->assertAuthenticated();
    }

    /**
     * Test that the logout route is disabled if disabled in env
     *
     * @return void
     */
    public function test_logout_route_disabled()
    {
        Config::set('services.shibboleth.enabled', false);
        $response = $this->get(route('auth.shibboleth.logout'));
        $response->assertNotFound();
    }

    /**
     * Test single logout
     *
     * @return void
     */
    public function test_logout()
    {
        $header = [
            'Accept-Language' => 'fr',
            'shib-session-id' => '_855fe7fbe56c664a6fad794c65243ec6',
            'shib-session-expires' => Carbon::now()->addHours(12)->timestamp,
            'principalname' => 'johnd@university.org',
            'givenname' => 'John',
            'surname' => 'Doe',
            'mail' => 'john.doe@domain.tld',
            'scoped-affiliation' => 'student@university.org;staff@university.org',
        ];

        $response = $this->get(route('auth.shibboleth.callback'), $header);
        $response = $this->withCookies([session()->getName() => Session::first()->id])->get($response->getTargetUrl(), $header);
        $this->assertAuthenticated();

        $header['referer'] = 'http://localhost';

        $response = $this->postJson(route('api.v1.logout'), [], $header);
        $this->assertGuest();
        $response->assertJsonPath('redirect', '/Shibboleth.sso/Logout?return=http://localhost/logout');
    }

    /**
     * Test IDP initiated logout via front channel
     *
     * @return void
     */
    public function test_front_channel_logout()
    {
        $header = [
            'Accept-Language' => 'fr',
            'shib-session-id' => '_855fe7fbe56c664a6fad794c65243ec6',
            'shib-session-expires' => Carbon::now()->addHours(12)->timestamp,
            'principalname' => 'johnd@university.org',
            'givenname' => 'John',
            'surname' => 'Doe',
            'mail' => 'john.doe@domain.tld',
            'scoped-affiliation' => 'student@university.org;staff@university.org',
        ];

        $response = $this->get(route('auth.shibboleth.callback'), $header);
        $response = $this->withCookies([session()->getName() => Session::first()->id])->get($response->getTargetUrl(), $header);
        $this->assertAuthenticated();

        // Try to logout with front channel logout
        $response = $this->get(route('auth.shibboleth.logout', ['action' => 'logout', 'return' => 'http://idp.org']), $header);
        $response->assertRedirect('http://idp.org');
        $this->assertGuest();
    }

    /**
     * Test IDP initiated logout via back channel
     *
     * @return void
     */
    public function test_back_channel_logout()
    {
        $header = [
            'Accept-Language' => 'fr',
            'shib-session-id' => '_855fe7fbe56c664a6fad794c65243ec6',
            'shib-session-expires' => Carbon::now()->addHours(12)->timestamp,
            'principalname' => 'johnd@university.org',
            'givenname' => 'John',
            'surname' => 'Doe',
            'mail' => 'john.doe@domain.tld',
            'scoped-affiliation' => 'student@university.org;staff@university.org',
        ];

        // Check no session exists yet
        $this->assertCount(0, Session::all());

        // Log user in
        $response = $this->get(route('auth.shibboleth.callback'), $header);
        $response = $this->withCookies([session()->getName() => Session::first()->id])->get($response->getTargetUrl(), $header);
        $this->assertAuthenticated();

        Auth::logout();

        // Check session still exists
        $this->assertCount(1, Session::all());

        // Send SOAP logout request
        $serverVariables = [
            'CONTENT_TYPE' => 'text/xml',
            'HTTP_USER_AGENT' => 'shibboleth/3.2.2 OpenSAML/3.2.0 XMLTooling/3.2.0 XML-Security-C/2.0.2 Xerces-C/3.2.2 log4shib/2.0.0 libcurl/7.68.0 OpenSSL/1.1.1f',
        ];
        $message = '<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><LogoutNotification xmlns="urn:mace:shibboleth:2.0:sp:notify" type="global"><SessionID>_855fe7fbe56c664a6fad794c65243ec6</SessionID></LogoutNotification></S:Body></S:Envelope>';
        $response = $this->call('POST', route('auth.shibboleth.logout'), [], [], [], $serverVariables, $message);

        // Get SAP logout response
        $xml = simplexml_load_string($response->getContent());

        // Check if response is successful
        $this->assertArrayHasKey('OK', (array) $xml->children('SOAP-ENV', true)->Body->LogoutNotificationResponse->children());

        // Check if session is terminated
        $this->assertCount(0, Session::all());
    }
}
