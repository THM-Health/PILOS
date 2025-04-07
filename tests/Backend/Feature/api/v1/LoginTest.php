<?php

namespace Tests\Backend\Feature\api\v1;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Tests\Backend\TestCase;
use TiMacDonald\Log\LogEntry;
use TiMacDonald\Log\LogFake;

class LoginTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'auth.local.enabled' => true,
        ]);
    }

    /**
     * Tests that a correct response gets returned when trying to login with invalid credentials.
     *
     * @return void
     */
    public function test_login_wrong_credentials()
    {
        $user = User::factory()->create([
            'password' => Hash::make('bar'),
        ]);
        $response = $this->from(config('app.url'))->postJson(route('api.v1.login.local'), [
            'email' => $user->email,
            'password' => 'foo',
        ]);
        $response->assertUnprocessable();
        $this->assertGuest();
    }

    /**
     * Tests a successful authentication with correct user credentials for database users.
     *
     * @return void
     */
    public function test_login_success_user_provider()
    {
        $user = User::factory()->make();
        $password = $user->password;
        $user->password = Hash::make($password);
        $user->save();
        $response = $this->from(config('app.url'))->postJson(route('api.v1.login.local'), [
            'email' => $user->email,
            'password' => $password,
        ]);
        $response->assertNoContent();
        $this->assertAuthenticated();

        // Authenticated user tries to login again
        $response = $this->from(config('app.url'))->postJson(route('api.v1.login.local'), [
            'email' => $user->email,
            'password' => $password,
        ]);
        $response->assertStatus(420);
    }

    /**
     * Test empty response for current user if the user isn't authenticated.
     *
     * @return void
     */
    public function test_unauthenticated_current_user()
    {
        $response = $this->getJson(route('api.v1.currentUser'));
        $response->assertOk();
        $response->assertJson([]);
    }

    /**
     * Test correct response for current user if the user is authenticated.
     *
     * @return void
     */
    public function test_authenticated_current_user()
    {
        $user = User::factory()->make();
        $response = $this->actingAs($user)->from(config('app.url'))->getJson(route('api.v1.currentUser'));
        $response->assertOk();
        $response->assertJsonFragment([
            'firstname' => $user->firstname,
            'lastname' => $user->lastname,
        ]);
    }

    /**
     * Test that unique permissions gets returned for the authenticated user.
     *
     * @return void
     */
    public function test_current_user_permissions()
    {
        $permission = Permission::firstOrCreate(['name' => 'test']);
        $includedPermission = Permission::firstOrCreate(['name' => 'test2']);

        $a = Role::firstOrCreate(['name' => 'a']);
        $a->permissions()->attach($permission->id);

        $b = Role::firstOrCreate(['name' => 'b']);
        $b->permissions()->attach($permission->id);

        $user = User::factory()->create();
        $user->roles()->attach([$a->id, $b->id]);
        $response = $this->actingAs($user)->from(config('app.url'))->getJson(route('api.v1.currentUser'));
        $response->assertOk();
        $response->assertJsonFragment([
            'firstname' => $user->firstname,
            'lastname' => $user->lastname,
            'permissions' => ['test'],
        ]);

        Permission::setIncludedPermissions('test', ['test2']);
        $user->refresh();

        $response = $this->actingAs($user)->from(config('app.url'))->getJson(route('api.v1.currentUser'));
        $response->assertOk();
        $response->assertJsonFragment([
            'firstname' => $user->firstname,
            'lastname' => $user->lastname,
            'permissions' => ['test', 'test2'],
        ]);
    }

    /**
     * Test that logout works as expected if the user is authenticated.
     *
     * @return void
     */
    public function test_logout_authenticated()
    {
        $user = User::factory()->make();
        $response = $this->actingAs($user)->from(config('app.url'))->postJson(route('api.v1.logout'));
        $response->assertJson(['redirect' => false]);
        $this->assertGuest();
    }

    /**
     * Test correct error message on calling logout as unauthenticated user.
     *
     * @return void
     */
    public function test_logout_unauthenticated()
    {
        $response = $this->postJson(route('api.v1.logout'));
        $response->assertUnauthorized();
        $response->assertJson([
            'message' => 'Unauthenticated.',
        ]);
    }

    /**
     * Tests logging of failed and successful logins.
     *
     * @return void
     */
    public function test_logging()
    {
        $user = User::factory()->create([
            'password' => Hash::make('bar'),
        ]);

        // test failed login
        Log::swap(new LogFake);
        $this->from(config('app.url'))->postJson(route('api.v1.login.local'), [
            'email' => $user->email,
            'password' => 'foo',
        ]);
        Log::assertLogged(
            fn (LogEntry $log) => $log->level === 'notice'
                && $log->message == 'Local user '.$user->email.' has failed local authentication.'
                && $log->context['ip'] == '127.0.0.1'
                && $log->context['current-user'] == 'guest'
        );

        // test successful login
        Log::swap(new LogFake);
        $this->from(config('app.url'))->postJson(route('api.v1.login.local'), [
            'email' => $user->email,
            'password' => 'bar',
        ]);
        Log::assertLogged(
            fn (LogEntry $log) => $log->level === 'info'
                && $log->message == 'Local user '.$user->email.' has been successfully authenticated.'
                && $log->context['ip'] == '127.0.0.1'
                && $log->context['current-user'] == 'guest'
        );
    }

    /**
     * Test that login route is diabled if local authenticator is disabled.
     *
     * @return void
     */
    public function test_login_disabled()
    {
        config([
            'auth.local.enabled' => false,
        ]);

        $user = User::factory()->create([
            'password' => Hash::make('bar'),
        ]);
        $response = $this->from(config('app.url'))->postJson(route('api.v1.login.local'), [
            'email' => $user->email,
            'password' => 'bar',
        ]);
        $response->assertNotFound();
    }
}
