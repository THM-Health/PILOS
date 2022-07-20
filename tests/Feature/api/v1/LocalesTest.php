<?php

namespace Tests\Feature\api\v1;

use App\User;
use Config;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Hash;
use LdapRecord\Laravel\Testing\DirectoryEmulator;
use LdapRecord\Models\OpenLDAP\User as LdapUser;
use Tests\TestCase;

class LocalesTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * @see TestCase::setUp()
     */
    protected function setUp(): void
    {
        parent::setUp();
        Config::set('ldap.enabled', true);
        $this->withoutMix();

        config([
            'app.available_locales' => ['fr', 'es', 'be', 'de', 'en', 'ru'],
            'app.fallback_locale'   => 'ru',
            'app.locale'            => 'en'
        ]);
    }

    /**
     * Test that the fallback locale gets used if the client sends a not existing locale with Accept-Language-Header.
     *
     * @return void
     */
    public function testNotExistingLocaleInAcceptHeader()
    {
        $response = $this->withHeaders([
            'Accept-Language' => 'foo'
        ])->get('/');
        $response->assertSee('<html lang="ru">', false);
    }

    /**
     * The locale of the current user should be used if the user is authenticated
     * and a locale is set for the current user.
     *
     * @return void
     */
    public function testLocaleOfAuthenticatedUser()
    {
        $user = User::factory()->create([
            'password' => Hash::make('bar')
        ]);
        $response = $this->actingAs($user)->withHeaders([
            'Accept-Language' => ''
        ])->get('/');
        $response->assertSee('<html lang="ru">', false);

        $user->update(['locale' => 'de' ]);
        $response = $this->actingAs($user)->get('/');
        $response->assertSee('<html lang="de">', false);
    }

    /**
     * The locale of the session should be used if set.
     *
     * @return void
     */
    public function testLocalePersistedInSession()
    {
        $response = $this->session([
            'locale' => 'de'
        ])->get('/');
        $response->assertSee('<html lang="de">', false);
    }

    /**
     * The locale of the session should be used if set even if there is another
     * language provided by Accept-Language-Header.
     *
     * @return void
     */
    public function testLocaleInHeaderAndSession()
    {
        $response = $this->session([
            'locale' => 'de'
        ])->withHeaders([
            'Accept-Language' => 'fr'
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
    public function testLocaleInHeader()
    {
        $response = $this->withHeaders([
            'Accept-Language' => 'de'
        ])->get('/');
        $response->assertSee('<html lang="de">', false);
    }

    /**
     * If the current user has a locale set it should be used even if there is another
     * locale persisted in the current session and/or provided by the Accept-Language-Header.
     *
     * @return void
     */
    public function testLocaleDifferentLocalesEverywhere()
    {
        $user = User::factory()->create([
            'password' => Hash::make('bar'),
            'locale'   => 'fr'
        ]);
        $response = $this->actingAs($user)->session([
            'locale' => 'es'
        ])->withHeaders([
            'Accept-Language' => 'be'
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
    public function testSetLocale()
    {
        $response = $this->withHeaders([
            'Accept-Language' => ''
        ])->get('/');
        $response->assertSee('<html lang="ru">', false);

        $response = $this->from(config('app.url'))->postJson(route('api.v1.setLocale'), [
            'locale' => 'us'
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['locale']);

        $response = $this->from(config('app.url'))->postJson(route('api.v1.setLocale'), [
            'locale' => 'fr'
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
    public function testSetLocaleUpdatesCurrentUsersLocale()
    {
        $user = User::factory()->create([
            'password' => Hash::make('bar'),
            'locale'   => 'fr'
        ]);
        $response = $this->actingAs($user)->session([
            'locale' => 'es'
        ])->withHeaders([
            'Accept-Language' => 'be'
        ])->from(config('app.url'))->get('/');
        $response->assertSee('<html lang="fr">', false);

        $response = $this->actingAs($user)->from(config('app.url'))->postJson(route('api.v1.setLocale'), [
            'locale' => 'de'
        ]);
        $response->assertOk();

        $response = $this->actingAs($user)->from(config('app.url'))->get('/');
        $response->assertSee('<html lang="de">', false);
        $this->assertDatabaseHas('users', [
            'id'     => $user->id,
            'locale' => 'de'
        ]);
    }

    public function testDefaultLocaleSetAutomaticallyForLdapUsersOnLogin()
    {
        $fake = DirectoryEmulator::setup('default');

        $ldapUser = LdapUser::create([
            'givenName'              => $this->faker->firstName,
            'sn'                     => $this->faker->lastName,
            'cn'                     => $this->faker->name,
            'mail'                   => $this->faker->unique()->safeEmail,
            'uid'                    => $this->faker->unique()->userName,
            'entryuuid'              => $this->faker->uuid,
            'password'
        ]);

        $fake->actingAs($ldapUser);

        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => $ldapUser->uid[0],
            'password' => 'secret'
        ]);

        $ldapUser = User::where(['authenticator' => 'ldap'])->first();

        $this->assertEquals('en', $ldapUser->locale);
    }
}
