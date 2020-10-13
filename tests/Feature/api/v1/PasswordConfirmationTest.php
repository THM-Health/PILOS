<?php

namespace Tests\Feature\api\v1;

use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Hash;
use LdapRecord\Laravel\Testing\DirectoryEmulator;
use Tests\TestCase;
use LdapRecord\Models\OpenLDAP\User as LdapUser;

class PasswordConfirmationTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function testPasswordConfirmationUsers()
    {
        $user = factory(User::class)->create([
            'password' => Hash::make('test')
        ]);

        $this->getJson(route('api.v1.password.confirmed'))
            ->assertUnauthorized();

        $this->postJson(route('api.v1.password.confirm'), [
            'password' => 'test'
        ])->assertUnauthorized();

        $this->from(config('app.url'))->actingAs($user)->getJson(route('api.v1.password.confirmed'))
            ->assertStatus(423);

        $this->from(config('app.url'))->postJson(route('api.v1.password.confirm'), [
            'password' => 'foo'
        ])->assertStatus(422)
          ->assertJsonValidationErrors('password');

        $this->from(config('app.url'))->postJson(route('api.v1.password.confirm'), [
            'password' => 'test'
        ])->assertNoContent();

        $this->from(config('app.url'))->getJson(route('api.v1.password.confirmed'))
            ->assertNoContent();
    }

    public function testPasswordConfirmationLdap()
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

        $this->getJson(route('api.v1.password.confirmed'))
            ->assertUnauthorized();

        $this->postJson(route('api.v1.password.confirm'), [
            'password' => 'secret'
        ])->assertUnauthorized();

        $fake->actingAs($ldapUser);

        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => $ldapUser->uid[0],
            'password' => 'secret'
        ]);

        $this->from(config('app.url'))->getJson(route('api.v1.password.confirmed'))
            ->assertStatus(423);

        $this->from(config('app.url'))->postJson(route('api.v1.password.confirm'), [
            'password' => 'secret'
        ])->assertNoContent();

        $this->from(config('app.url'))->getJson(route('api.v1.password.confirmed'))
            ->assertNoContent();
    }
}
