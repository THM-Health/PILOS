<?php

namespace Tests\Feature\api\v1;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;
use TiMacDonald\Log\LogEntry;
use TiMacDonald\Log\LogFake;

class LoginTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * Tests that a correct response gets returned when trying to login with invalid credentials.
     *
     * @return void
     */
    public function testLoginWrongCredentials()
    {
        $user = User::factory()->create([
            'password' => Hash::make('bar')
        ]);
        $response = $this->from(config('app.url'))->postJson(route('api.v1.login'), [
            'email'    => $user->email,
            'password' => 'foo'
        ]);
        $response->assertStatus(422);
        $this->assertGuest();
    }

    /**
     * Tests a successful authentication with correct user credentials for database users.
     *
     * @return void
     */
    public function testLoginSuccessUserProvider()
    {
        $user           = User::factory()->make();
        $password       = $user->password;
        $user->password = Hash::make($password);
        $user->save();
        $response = $this->from(config('app.url'))->postJson(route('api.v1.login'), [
            'email'    => $user->email,
            'password' => $password
        ]);
        $response->assertNoContent();
        $this->assertAuthenticated();

        // Authenticated user tries to login again
        $response = $this->from(config('app.url'))->postJson(route('api.v1.login'), [
            'email'    => $user->email,
            'password' => $password
        ]);
        $response->assertStatus(420);
    }

    /**
     * Test empty response for current user if the user isn't authenticated.
     *
     * @return void
     */
    public function testUnauthenticatedCurrentUser()
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
    public function testAuthenticatedCurrentUser()
    {
        $user     = User::factory()->make();
        $response = $this->actingAs($user)->from(config('app.url'))->getJson(route('api.v1.currentUser'));
        $response->assertOk();
        $response->assertJsonFragment([
            'firstname' => $user->firstname,
            'lastname'  => $user->lastname
        ]);
    }

    /**
     * Test that unique permissions gets returned for the authenticated user.
     *
     * @return void
     */
    public function testCurrentUserPermissions()
    {
        $permission         = Permission::firstOrCreate([ 'name' => 'test' ]);
        $includedPermission = Permission::firstOrCreate([ 'name' => 'test2' ]);

        $a = Role::firstOrCreate(['name' => 'a']);
        $a->permissions()->attach($permission->id);

        $b = Role::firstOrCreate(['name' => 'b']);
        $b->permissions()->attach($permission->id);

        $user     = User::factory()->create();
        $user->roles()->attach([$a->id, $b->id]);
        $response = $this->actingAs($user)->from(config('app.url'))->getJson(route('api.v1.currentUser'));
        $response->assertOk();
        $response->assertJsonFragment([
            'firstname'   => $user->firstname,
            'lastname'    => $user->lastname,
            'permissions' => ['test']
        ]);

        Permission::SetupIncludedPermissions('test', ['test2']);
        $user->refresh();

        $response = $this->actingAs($user)->from(config('app.url'))->getJson(route('api.v1.currentUser'));
        $response->assertOk();
        $response->assertJsonFragment([
            'firstname'   => $user->firstname,
            'lastname'    => $user->lastname,
            'permissions' => ['test','test2']
        ]);
    }

    /**
     * Test that logout works as expected if the user is authenticated.
     *
     * @return void
     */
    public function testLogoutAuthenticated()
    {
        $user     = User::factory()->make();
        $response = $this->actingAs($user)->from(config('app.url'))->postJson(route('api.v1.logout'));
        $response->assertNoContent();
        $this->assertGuest();
    }

    /**
     * Test correct error message on calling logout as unauthenticated user.
     *
     * @return void
     */
    public function testLogoutUnauthenticated()
    {
        $response = $this->postJson(route('api.v1.logout'));
        $response->assertUnauthorized();
        $response->assertJson([
            'message' => 'Unauthenticated.'
        ]);
    }

    /**
     * Tests logging of failed and successful logins.
     *
     * @return void
     */
    public function testLogging()
    {
        $user = User::factory()->create([
            'password' => Hash::make('bar')
        ]);

        // test failed login with logging enabled
        Log::swap(new LogFake);
        config(['auth.log.failed' => true]);
        $this->from(config('app.url'))->postJson(route('api.v1.login'), [
            'email'    => $user->email,
            'password' => 'foo'
        ]);
        Log::assertLogged(
            fn (LogEntry $log) =>
            $log->level === 'info'
            && $log->message == 'User ['.$user->email.'] has failed authentication.'
            && $log->context['ip'] == '127.0.0.1'
            && $log->context['user-agent'] == 'Symfony'
            && $log->context['authenticator'] == 'users'
        );

        // test failed login with logging disabled
        config(['auth.log.failed' => false]);
        Log::swap(new LogFake);
        $this->from(config('app.url'))->postJson(route('api.v1.login'), [
            'email'    => $user->email,
            'password' => 'foo'
        ]);
        Log::assertNotLogged(
            fn (LogEntry $log) =>
            $log->level === 'info'
            && $log->message == 'User ['.$user->email.'] has failed authentication.'
                && $log->context['ip'] == '127.0.0.1'
                && $log->context['user-agent'] == 'Symfony'
                && $log->context['authenticator'] == 'users'
        );

        // test successful login with logging enabled
        Log::swap(new LogFake);
        config(['auth.log.successful' => true]);
        $this->from(config('app.url'))->postJson(route('api.v1.login'), [
            'email'    => $user->email,
            'password' => 'bar'
        ]);
        Log::assertLogged(
            fn (LogEntry $log) =>
            $log->level === 'info'
            && $log->message == 'User ['.$user->email.'] has been successfully authenticated.'
            && $log->context['ip'] == '127.0.0.1'
            && $log->context['user-agent'] == 'Symfony'
            && $log->context['authenticator'] == 'users'
        );

        // logout user to allow new login
        Auth::guard('users')->logout();

        // test successful login with logging disabled
        Log::swap(new LogFake);
        config(['auth.log.successful' => false]);
        $this->from(config('app.url'))->postJson(route('api.v1.login'), [
            'email'    => $user->email,
            'password' => 'bar'
        ]);
        Log::assertNotLogged(
            fn (LogEntry $log) =>
            $log->level === 'info'
            && $log->message == 'User ['.$user->email.'] has been successfully authenticated.'
                && $log->context['ip'] == '127.0.0.1'
                && $log->context['user-agent'] == 'Symfony'
                && $log->context['authenticator'] == 'users'
        );
    }
}
