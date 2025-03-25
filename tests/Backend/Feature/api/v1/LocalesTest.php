<?php

namespace Tests\Backend\Feature\api\v1;

use App\Models\User;
use App\Services\LocaleService;
use Config;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Hash;
use LdapRecord\Container;
use LdapRecord\Laravel\Testing\DirectoryEmulator;
use LdapRecord\Models\OpenLDAP\User as LdapUser;
use Tests\Backend\TestCase;

class LocalesTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    private $ldapMapping = '
    {
        "attributes": {
          "external_id": "uid",
          "first_name": "givenname",
          "last_name": "sn",
          "email": "mail",
          "roles": "userclass",
          "ou": "ou"
        },
        "roles": []
      }
      ';

    /**
     * @see TestCase::setUp()
     */
    protected function setUp(): void
    {
        parent::setUp();
        Config::set('ldap.enabled', true);
        Config::set('ldap.mapping', json_decode($this->ldapMapping));
        $this->withoutMix();

        config([
            'app.enabled_locales' => ['de' => ['name' => 'Deutsch', 'dateTimeFormat' => []], 'en' => ['name' => 'English', 'dateTimeFormat' => []], 'fr' => ['name' => 'Français', 'dateTimeFormat' => []]],
            'app.locale' => 'en',
        ]);
    }

    /**
     * Test that the default locale gets used if the client sends a not existing locale with Accept-Language-Header.
     *
     * @return void
     */
    public function test_not_existing_locale_in_accept_header()
    {
        config([
            'app.locale' => 'de',
        ]);

        $response = $this->withHeaders([
            'Accept-Language' => 'foo',
        ])->get('/');
        $response->assertSee('<html lang="de">', false);
    }

    /**
     * The locale of the current user should be used if the user is authenticated
     * and a locale is set for the current user.
     *
     * @return void
     */
    public function test_locale_of_authenticated_user()
    {
        $user = User::factory()->create([
            'password' => Hash::make('bar'),
        ]);
        $response = $this->actingAs($user)->withHeaders([
            'Accept-Language' => '',
        ])->get('/');
        $response->assertSee('<html lang="en">', false);

        $user->update(['locale' => 'de']);
        $response = $this->actingAs($user)->get('/');
        $response->assertSee('<html lang="de">', false);
    }

    /**
     * The locale of the session should be used if set.
     *
     * @return void
     */
    public function test_locale_persisted_in_session()
    {
        $response = $this->session([
            'locale' => 'de',
        ])->get('/');
        $response->assertSee('<html lang="de">', false);
    }

    /**
     * The locale of the session should be used if set even if there is another
     * language provided by Accept-Language-Header.
     *
     * @return void
     */
    public function test_locale_in_header_and_session()
    {
        $response = $this->session([
            'locale' => 'de',
        ])->withHeaders([
            'Accept-Language' => 'fr',
        ])->get('/');
        $response->assertSee('<html lang="de">', false);
    }

    /**
     * If a existing locale is provided by the Accept-Language-Header it should be
     * used if there is no current authenticated user and no language is persisted
     * in the current session.
     *
     * @return void
     */
    public function test_locale_in_header()
    {
        $response = $this->withHeaders([
            'Accept-Language' => 'de',
        ])->get('/');
        $response->assertSee('<html lang="de">', false);
    }

    /**
     * If the current user has a locale set it should be used even if there is another
     * locale persisted in the current session and/or provided by the Accept-Language-Header.
     *
     * @return void
     */
    public function test_locale_different_locales_everywhere()
    {
        $user = User::factory()->create([
            'password' => Hash::make('bar'),
            'locale' => 'fr',
        ]);
        $response = $this->actingAs($user)->session([
            'locale' => 'es',
        ])->withHeaders([
            'Accept-Language' => 'be',
        ])->get('/');
        $response->assertSee('<html lang="fr">', false);
    }

    /**
     * When setting a not existing locale to the current session a validation error should be thrown.
     * The set locale should be used after setting a existing locale to the current session and
     * reloading the page.
     *
     * @return void
     */
    public function test_set_locale()
    {
        $response = $this->withHeaders([
            'Accept-Language' => '',
        ])->get('/');
        $response->assertSee('<html lang="en">', false);

        $response = $this->from(config('app.url'))->postJson(route('api.v1.locale.update'), [
            'locale' => 'us',
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['locale']);

        $response = $this->from(config('app.url'))->postJson(route('api.v1.locale.update'), [
            'locale' => 'fr',
        ]);
        $response->assertOk();

        $response = $this->get('/');
        $response->assertSee('<html lang="fr">', false);
    }

    /**
     * If the user is authenticated and an setLocale api call gets done the locale of the current user should
     * also be updated to the new locale.
     *
     * @return void
     */
    public function test_set_locale_updates_current_users_locale()
    {
        $user = User::factory()->create([
            'password' => Hash::make('bar'),
            'locale' => 'fr',
        ]);
        $response = $this->actingAs($user)->session([
            'locale' => 'es',
        ])->withHeaders([
            'Accept-Language' => 'be',
        ])->from(config('app.url'))->get('/');
        $response->assertSee('<html lang="fr">', false);

        $response = $this->actingAs($user)->from(config('app.url'))->postJson(route('api.v1.locale.update'), [
            'locale' => 'de',
        ]);
        $response->assertOk();

        $response = $this->actingAs($user)->from(config('app.url'))->get('/');
        $response->assertSee('<html lang="de">', false);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'locale' => 'de',
        ]);
    }

    public function test_default_locale_set_automatically_for_ldap_users_on_login()
    {
        Container::getConnection('default')->getConfiguration()->set('use_tls', false);
        Container::getConnection('default')->getConfiguration()->set('use_ssl', false);
        $fake = DirectoryEmulator::setup('default');

        $externalUser = LdapUser::create([
            'givenName' => $this->faker->firstName,
            'sn' => $this->faker->lastName,
            'cn' => $this->faker->name,
            'mail' => $this->faker->unique()->safeEmail,
            'uid' => $this->faker->unique()->userName,
            'entryuuid' => $this->faker->uuid,
            'password',
        ]);

        $fake->actingAs($externalUser);

        $this->from(config('app.url'))->postJson(route('api.v1.login.ldap'), [
            'username' => $externalUser->uid[0],
            'password' => 'secret',
        ]);

        $externalUser = User::where(['authenticator' => 'ldap'])->first();

        $this->assertEquals('en', $externalUser->locale);
    }

    public function test_locale_data_invalid()
    {
        $this->getJson(route('api.v1.locale.get', [
            'locale' => 'invalid',
        ]))->assertNotFound();
    }

    public function test_locale_data()
    {
        $content = [
            'key1' => 'value1',
        ];

        $this->mock(LocaleService::class)
            ->shouldReceive('getJsonLocale')
            ->once()
            ->with('de')
            ->andReturn(json_encode($content));

        $response = $this->getJson(route('api.v1.locale.get', [
            'locale' => 'de',
        ]));

        $this->assertEquals($content, $response->json('data'));
        $this->assertEquals(['name' => 'Deutsch', 'dateTimeFormat' => []], $response->json('meta'));
    }
}
