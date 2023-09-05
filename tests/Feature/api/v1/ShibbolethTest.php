<?php

namespace Tests\Feature\api\v1;

use App\Models\Role;
use App\Models\User;
use Config;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

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
        Config::set('app.enabled_locales', ['de', 'en', 'fr']);

        Role::factory()->create(['name' => 'admin']);
        Role::factory()->create(['name' => 'user']);
        Role::factory()->create(['name' => 'guests']);
    }

    /**
     * Test that the redirect route is disabled if disabled in env
     *
     * @return void
     */
    public function testRedirectRouteDisabled()
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
    public function testRedirectRoute()
    {
        $response = $this->get(route('auth.shibboleth.redirect', ['redirect' => '/rooms/abc-123-def']));
        $response->assertRedirectToRoute('auth.shibboleth.callback', ['redirect' => '/rooms/abc-123-def']);
    }

    /**
     * Test that the callback route is disabled if disabled in env
     *
     * @return void
     */
    public function testCallbackRouteDisabled()
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
    public function testCallbackRouteAsLoggedInUser()
    {
        $user     = User::factory()->create();
        $response = $this->actingAs($user)->get(route('auth.shibboleth.callback'));
        $response->assertStatus(420);
    }

    /**
     * Test callback route with no headers
     *
     * @return void
     */
    public function testCallbackRouteWithNoHeaders()
    {
        $response = $this->get(route('auth.shibboleth.callback'));
        $response->assertRedirect('/external_login?error=missing_attributes');
    }

    /**
     * Test user creation and role mapping with all required attributes
     * 
     * @return void
     */
    public function testCallbackRouteWithValidData()
    {
        setting()->set('default_timezone', 'Europe/Paris');
 
        $header = [
            'Accept-Language'      => 'fr',
            'shib-session-id'      => 'default',
            'shib-session-expires' => '2021-01-01T00:00',
            'principalname'        => 'johnd@university.org',
            'givenname'            => 'John',
            'surname'              => 'Doe',
            'mail'                 => 'john.doe@domain.tld',
            'scoped-affiliation'   => 'student@university.org;staff@university.org'
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
    public function testCallbackRouteExistingUser()
    {
        $user = User::factory()->create([
            'authenticator' => 'shibboleth',
            'external_id'   => 'johnd@university.org',
            'firstname'     => 'Max',
            'lastname'      => 'Mustermann',
            'email'         => 'max.mustermann@domain.de',
            'locale'        => 'de',
            'timezone'      => 'Europe/Berlin'
        ]);

        $adminRole = Role::where('name', 'admin')->first();
        $guestrole = Role::where('name', 'guests')->first();

        $user->roles()->sync([$guestrole->id => ['automatic' => true], $adminRole->id]);

        setting()->set('default_timezone', 'Europe/Paris');
 
        $header = [
            'Accept-Language'      => 'fr',
            'shib-session-id'      => 'default',
            'shib-session-expires' => '2021-01-01T00:00',
            'principalname'        => 'johnd@university.org',
            'givenname'            => 'John',
            'surname'              => 'Doe',
            'mail'                 => 'john.doe@domain.tld',
            'scoped-affiliation'   => 'student@university.org;staff@university.org'
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
        $this->assertEquals($user->roles()->pluck('name')->toArray(), ['admin','user']);
    }

    /**
     * Test that the logout route is disabled if disabled in env
     *
     * @return void
     */
    public function testLogoutRouteDisabled()
    {
        Config::set('services.shibboleth.enabled', false);
        $response = $this->get(route('auth.shibboleth.logout'));
        $response->assertNotFound();
    }
}
