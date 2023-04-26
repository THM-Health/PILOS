<?php

namespace Tests\Feature\api\v1;

use App\Enums\CustomStatusCodes;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Session;
use App\Models\User;
use App\Notifications\EmailChanged;
use App\Notifications\PasswordChanged;
use App\Notifications\PasswordReset;
use App\Notifications\UserWelcome;
use App\Notifications\VerifyEmail;
use Cache;
use Carbon\Carbon;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Storage;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public const INVALID_USER_ID = 999999999;

    public function testIndex()
    {
        $page_size = 5;
        setting(['pagination_page_size' => $page_size]);

        // Create Users + Ldap User with roles
        $users  = User::factory()->count(10)->create([
            'firstname' => 'Darth',
            'lastname'  => 'Vader'
        ]);
        $user   = User::factory()->create([
            'firstname' => 'John',
            'lastname'  => 'Doe'
        ]);

        $externalUser = User::factory()->create([
            'external_id'   => $this->faker->unique()->userName,
            'authenticator' => 'external',
            'email'         => $this->faker->unique()->safeEmail,
            'firstname'     => 'Jane',
            'lastname'      => 'Doe'
        ]);

        $this->assertDatabaseCount('users', 12);

        // Unauthenticated user
        $this->getJson(route('api.v1.users.index'))->assertUnauthorized();

        // User without permission
        $this->actingAs($user)->getJson(route('api.v1.users.index'))->assertForbidden();

        // Authenticated user with permission
        $role = Role::factory()->create(['default' => true]);

        $permission = Permission::firstOrCreate([ 'name' => 'users.viewAny' ]);
        $role->permissions()->attach($permission->id);
        $role->users()->attach([$externalUser->id, $user->id]);

        $role2 = Role::factory()->create();
        $role2->users()->attach([$users[0]->id, $user->id]);

        $this->actingAs($user)->getJson(route('api.v1.users.index'))
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['firstname' => $users[0]->firstname])
            ->assertJsonFragment(['firstname' => $users[4]->firstname])
            ->assertJsonFragment(['per_page' => $page_size])
            ->assertJsonFragment(['total' => 12])
            ->assertJsonStructure([
                'meta',
                'links',
                'data' => [
                    '*' => [
                        'id',
                        'authenticator',
                        'email',
                        'roles',
                        'firstname',
                        'lastname',
                        'user_locale',
                        'updated_at',
                        'room_limit',
                        'model_name',
                        'image'
                    ]
                ]
            ]);

        // Pagination
        $this->getJson(route('api.v1.users.index') . '?page=2')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['firstname' => $users[5]->firstname]);

        // Sorting
        $this->getJson(route('api.v1.users.index') . '?sort_by=firstname&sort_direction=desc')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['firstname' => $user->firstname])
            ->assertJsonFragment(['firstname' => $externalUser->firstname]);

        // Sorting wrong direction and field
        $this->getJson(route('api.v1.users.index') . '?sort_by=username&sort_direction=desc')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonMissingExact(['firstname' => $user->firstname])
            ->assertJsonMissingExact(['firstname' => $externalUser->firstname]);

        $this->getJson(route('api.v1.users.index') . '?sort_by=firstname')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonMissingExact(['firstname' => $user->firstname])
            ->assertJsonMissingExact(['firstname' => $externalUser->firstname]);

        $this->getJson(route('api.v1.users.index') . '?sort_direction=desc')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonMissingExact(['firstname' => $user->firstname])
            ->assertJsonMissingExact(['firstname' => $externalUser->firstname]);

        $this->getJson(route('api.v1.users.index') . '?sort_by=foo&sort_direction=desc')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonMissingExact(['firstname' => $user->firstname])
            ->assertJsonMissingExact(['firstname' => $externalUser->firstname]);

        $this->getJson(route('api.v1.users.index') . '?sort_by=firstname&sort_direction=foo')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonMissingExact(['firstname' => $user->firstname])
            ->assertJsonMissingExact(['firstname' => $externalUser->firstname]);

        // Filtering by name
        $this->getJson(route('api.v1.users.index') . '?name=J%20Doe')
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['firstname' => $user->firstname])
            ->assertJsonFragment(['firstname' => $externalUser->firstname]);

        // Filtering by role
        $this->getJson(route('api.v1.users.index') . '?role='.$role2->id)
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['id' => $users[0]->id])
            ->assertJsonFragment(['id' => $user->id]);

        // Filtering by invalid role
        $this->getJson(route('api.v1.users.index') . '?role=0')
            ->assertJsonValidationErrors(['role']);

        // Filtering by name
        $this->getJson(route('api.v1.users.index') . '?name=J%20Doe')
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['firstname' => $user->firstname])
            ->assertJsonFragment(['firstname' => $externalUser->firstname]);

        // Filtering by role and name
        $this->getJson(route('api.v1.users.index') . '?name=John&role='.$role2->id)
            ->assertSuccessful()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['id' => $user->id]);
    }

    public function testSearch()
    {
        $page_size = 5;
        config(['bigbluebutton.user_search_limit' => $page_size]);

        $users   = [];
        $users[] = User::factory()->create(['firstname' => 'Gregory', 'lastname'  => 'Dumas']);
        $users[] = User::factory()->create(['firstname' => 'Mable', 'lastname'  => 'Torres']);
        $users[] = User::factory()->create(['firstname' => 'Bertha', 'lastname'  => 'Luff']);
        $users[] = User::factory()->create(['firstname' => 'Marie', 'lastname'  => 'Walker']);
        $users[] = User::factory()->create(['firstname' => 'Connie', 'lastname'  => 'Braun']);
        $users[] = User::factory()->create(['firstname' => 'Deborah', 'lastname'  => 'Braun']);

        // Unauthenticated user
        $this->getJson(route('api.v1.users.search'))->assertUnauthorized();

        // Test without query and order asc lastname and asc firstname
        $result = $this->actingAs($users[0])->getJson(route('api.v1.users.search'))
            ->assertSuccessful()
            ->assertJsonPath('data.0.firstname', $users[4]->firstname)
            ->assertJsonPath('data.0.lastname', $users[4]->lastname)
            ->assertJsonPath('data.0.email', $users[4]->email)
            ->assertJsonPath('data.1.firstname', $users[5]->firstname)
            ->assertJsonPath('data.2.firstname', $users[0]->firstname)
            ->assertJsonPath('data.3.firstname', $users[2]->firstname)
            ->assertJsonPath('data.4.firstname', $users[1]->firstname)
            ->assertJsonCount($page_size, 'data');

        // check only the four attributes are returned
        foreach ($result->json('data') as $user) {
            $this->assertEquals(array_keys($user), ['id','firstname','lastname','email']);
        }

        // Check with lastname query
        $this->actingAs($users[0])->getJson(route('api.v1.users.search').'?query=Braun')
            ->assertSuccessful()
            ->assertJsonPath('data.0.firstname', $users[4]->firstname)
            ->assertJsonPath('data.1.firstname', $users[5]->firstname)
            ->assertJsonCount(2, 'data');

        // check with multiple words
        $this->actingAs($users[0])->getJson(route('api.v1.users.search').'?query=Braun+Connie')
            ->assertSuccessful()
            ->assertJsonPath('data.0.firstname', $users[4]->firstname)
            ->assertJsonCount(1, 'data');

        // check with fragment
        $this->actingAs($users[0])->getJson(route('api.v1.users.search').'?query=Ma')
            ->assertSuccessful()
            ->assertJsonPath('data.0.firstname', $users[0]->firstname)
            ->assertJsonPath('data.1.firstname', $users[1]->firstname)
            ->assertJsonPath('data.2.firstname', $users[3]->firstname)
            ->assertJsonCount(3, 'data');
    }

    public function testCreate()
    {
        $user = User::factory()->create();

        $request = [];

        // Unauthenticated user
        $this->postJson(route('api.v1.users.store', $request))->assertUnauthorized();

        // User without permission
        $this->actingAs($user)->postJson(route('api.v1.users.store', $request))->assertForbidden();

        // Invalid request
        $role = Role::factory()->create(['default' => true]);

        $permission = Permission::firstOrCreate([ 'name' => 'users.create' ]);
        $role->permissions()->attach($permission->id);

        $role->users()->attach([$user->id]);

        $externalUser = User::factory()->create([
            'external_id'   => $this->faker->unique()->userName,
            'authenticator' => 'external',
            'email'         => $this->faker->unique()->safeEmail,
            'firstname'     => 'Jane',
            'lastname'      => 'Doe'
        ]);

        // Empty request
        $this->actingAs($user)->postJson(route('api.v1.users.store', $request))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['firstname', 'generate_password', 'email', 'lastname', 'user_locale', 'roles']);

        $request = [
            'firstname'         => str_repeat('a', 256),
            'lastname'          => str_repeat('a', 256),
            'user_locale'       => 451,
            'email'             => 'test',
            'generate_password' => 0,
            'new_password'      => 'aT2wqw_2',
            'roles'             => [99],
            'timezone'          => 'Europe/Berlin'
        ];

        $this->postJson(route('api.v1.users.store', $request))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['firstname', 'new_password', 'email', 'lastname', 'user_locale', 'roles.0']);

        config([
            'app.available_locales' => ['fr', 'es', 'be', 'de', 'en', 'ru'],
        ]);

        $request = [
            'firstname'                 => $this->faker->firstName,
            'lastname'                  => $this->faker->lastName,
            'user_locale'               => 'hr',
            'email'                     => $user->email,
            'generate_password'         => false,
            'new_password'              => 'aT2wqw_2',
            'new_password_confirmation' => 'aT2wqw_2',
            'roles'                     => [$role->id],
            'authenticator'             => 'external',
            'timezone'                  => 'UTC'
        ];

        $this->postJson(route('api.v1.users.store', $request))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'user_locale']);

        $request['email']                   = $externalUser->email;
        $request['user_locale']             = 'de';

        $this->postJson(route('api.v1.users.store', $request))
            ->assertSuccessful()
            ->assertJsonFragment([
                'firstname'            => $request['firstname'],
                'lastname'             => $request['lastname'],
                'user_locale'          => $request['user_locale'],
                'email'                => $request['email'],
                'roles'                => [[ 'id' => $role->id, 'name' => $role->name, 'automatic' => false ]],
                'authenticator'        => 'local',
            ]);
    }

    /**
     * Test if users can update own profile
     */
    public function testUpdateSelf()
    {
        config([
            'app.available_locales' => ['fr', 'es', 'be', 'de', 'en', 'ru'],
        ]);

        $roleA = Role::factory()->create();
        $roleB = Role::factory()->create();

        $user = User::factory()->create(['locale' => 'en', 'timezone' => 'UTC', 'bbb_skip_check_audio' => false]);
        $user->roles()->sync([$roleA->id, $roleB->id]);

        $changes = [
            'firstname'            => $this->faker->firstName,
            'lastname'             => $this->faker->lastName,
            'user_locale'          => 'de',
            'bbb_skip_check_audio' => true,
            'timezone'             => 'Foo/Bar',
            'roles'                => [$roleA->id],
        ];

        // Unauthenticated user
        $this->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertUnauthorized();

        // Try to update user without timestamp
        $this->actingAs($user)->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertStatus(CustomStatusCodes::STALE_MODEL);

        // Check with timestamp and invalid data
        $changes['updated_at']           = Carbon::now();
        $changes['bbb_skip_check_audio'] = 'test';
        $this->actingAs($user)->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['bbb_skip_check_audio', 'timezone']);

        // Check with valid data
        $changes['bbb_skip_check_audio'] = 0;
        $changes['timezone']             = 'Europe/Berlin';
        $this->actingAs($user)->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertSuccessful();
        $user->refresh();

        // Firstname and lastname should not be changed, due to missing permissions
        $this->assertNotEquals($user->firstname, $changes['firstname']);
        $this->assertNotEquals($user->lastname, $changes['lastname']);
        // Other attributes should be changed
        $this->assertEquals($user->locale, $changes['user_locale']);
        $this->assertEquals($user->timezone, $changes['timezone']);
        $this->assertEquals($user->bbb_skip_check_audio, $changes['bbb_skip_check_audio']);

        // Check if attributes (firstname/lastname) can be changed with special permission, but role cannot be changed
        $permission = Permission::firstOrCreate(['name' => 'users.updateOwnAttributes']);
        $roleA->permissions()->attach($permission->id);
        $changes['updated_at'] = Carbon::now();
        $this->actingAs($user)->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertSuccessful();
        $user->refresh();
        $this->assertEquals($user->firstname, $changes['firstname']);
        $this->assertEquals($user->lastname, $changes['lastname']);
        $this->assertNotEquals($user->roles->pluck('id')->toArray(), [$roleA->id]);

        // Check if role cannot be changed for current user, even with permissions to change role
        $permission = Permission::firstOrCreate(['name' => 'users.update']);
        $roleA->permissions()->attach($permission->id);
        $changes['updated_at'] = Carbon::now();
        $this->actingAs($user)->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertSuccessful();
        $user->refresh();
        $this->assertNotEquals($user->roles->pluck('id')->toArray(), [$roleA->id]);
    }

    /**
     * Test if ldap-users can update own profile
     */
    public function testUpdateSelfLdap()
    {
        config([
            'app.available_locales' => ['fr', 'es', 'be', 'de', 'en', 'ru'],
        ]);

        $roleA      = Role::factory()->create();
        $permission = Permission::firstOrCreate(['name' => 'users.updateOwnAttributes']);
        $roleA->permissions()->attach($permission->id);

        $roleB = Role::factory()->create();

        $user = User::factory()->create(['authenticator' => 'external', 'external_id' => $this->faker->unique()->userName, 'locale' => 'en', 'timezone' => 'UTC', 'bbb_skip_check_audio' => false]);
        $user->roles()->sync([$roleA->id, $roleB->id]);

        $changes = [
            'firstname'            => $this->faker->firstName,
            'lastname'             => $this->faker->lastName,
            'user_locale'          => 'de',
            'bbb_skip_check_audio' => true,
            'timezone'             => 'Europe/Berlin',
            'roles'                => [$roleA->id],
        ];

        // Check if the attributes firstname and lastname cannot be changed even with special permission
        $changes['updated_at'] = Carbon::now();
        $this->actingAs($user)->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertSuccessful();
        $user->refresh();
        // Firstname and lastname should not be changed
        $this->assertNotEquals($user->firstname, $changes['firstname']);
        $this->assertNotEquals($user->lastname, $changes['lastname']);
        // Other attributes should be changed
        $this->assertEquals($user->locale, $changes['user_locale']);
        $this->assertEquals($user->timezone, $changes['timezone']);
        $this->assertEquals($user->bbb_skip_check_audio, $changes['bbb_skip_check_audio']);
    }

    /**
     * Test if admin users can update other users
     */
    public function testUpdate()
    {
        $roleA     = Role::factory()->create();
        $roleB     = Role::factory()->create();
        $adminRole = Role::factory()->create();

        $permission = Permission::firstOrCreate(['name' => 'users.update']);
        $adminRole->permissions()->attach($permission->id);

        $user      = User::factory()->create(['locale' => 'en', 'timezone' => 'UTC', 'bbb_skip_check_audio' => false]);
        $otherUser = User::factory()->create();
        $admin     = User::factory()->create();

        $user->roles()->sync([$roleA->id, $roleB->id]);
        $admin->roles()->sync([$adminRole->id]);

        $changes = [
            'firstname'            => $this->faker->firstName,
            'lastname'             => $this->faker->lastName,
            'user_locale'          => 'de',
            'bbb_skip_check_audio' => true,
            'timezone'             => 'Europe/Berlin',
            'roles'                => [$roleA->id],
        ];

        // Unauthorized
        $this->actingAs($otherUser)->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertForbidden();

        // Not existing user
        $this->actingAs($admin)->putJson(route('api.v1.users.update', ['user' => self::INVALID_USER_ID]), $changes)
            ->assertNotFound();

        // Check as admin
        $changes['updated_at'] = Carbon::now();
        $this->actingAs($admin)->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertSuccessful();
        $user->refresh();

        // Check if all attributes are changed
        $this->assertEquals($user->firstname, $changes['firstname']);
        $this->assertEquals($user->lastname, $changes['lastname']);
        $this->assertEquals($user->locale, $changes['user_locale']);
        $this->assertEquals($user->timezone, $changes['timezone']);
        $this->assertEquals($user->bbb_skip_check_audio, $changes['bbb_skip_check_audio']);
        $this->assertEquals($user->roles->pluck('id')->toArray(), [$roleA->id]);
    }

    /**
     * Test if admin users can update other ldap-users
     */
    public function testUpdateLdap()
    {
        $roleA     = Role::factory()->create();
        $roleB     = Role::factory()->create();
        $adminRole = Role::factory()->create();

        $permission = Permission::firstOrCreate(['name' => 'users.update']);
        $adminRole->permissions()->attach($permission->id);

        $user  = User::factory()->create(['authenticator' => 'external', 'external_id' => $this->faker->unique()->userName, 'locale' => 'en', 'timezone' => 'UTC', 'bbb_skip_check_audio' => false]);
        $admin = User::factory()->create();

        $user->roles()->sync([$roleA->id => ['automatic' => true], $roleB->id]);
        $admin->roles()->sync([$adminRole->id]);

        $changes = [
            'firstname'            => $this->faker->firstName,
            'lastname'             => $this->faker->lastName,
            'user_locale'          => 'de',
            'bbb_skip_check_audio' => true,
            'timezone'             => 'Europe/Berlin',
            'roles'                => [$roleB->id],
        ];

        // Check as admin
        $changes['updated_at'] = Carbon::now();
        $this->actingAs($admin)->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertSuccessful();
        $user->refresh();

        // Check if firstname and lastname cannot be changed for ldap users
        $this->assertNotEquals($user->firstname, $changes['firstname']);
        $this->assertNotEquals($user->lastname, $changes['lastname']);

        // Check if all other attributes are changed
        $this->assertEquals($user->locale, $changes['user_locale']);
        $this->assertEquals($user->timezone, $changes['timezone']);
        $this->assertEquals($user->bbb_skip_check_audio, $changes['bbb_skip_check_audio']);

        // Check if automatic role cannot be removed
        $this->assertEquals($user->roles->pluck('id')->toArray(), [$roleA->id, $roleB->id]);
    }

    /**
     * Test if user attributes can be updated separately
     */
    public function testPartialUpdate()
    {
        $user    = User::factory()->create(['firstname'=> 'John', 'lastname' => 'Doe', 'bbb_skip_check_audio' => false]);
        $newRole = Role::factory()->create();
        $user->roles()->attach($newRole);

        // Check if only updating single attributes works
        $this->assertFalse($user->bbb_skip_check_audio);
        $changes = [
            'bbb_skip_check_audio' => true,
            'updated_at'           => $user->updated_at,
        ];
        $this->actingAs($user)->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertSuccessful();
        $user->refresh();
        $this->assertTrue($user->bbb_skip_check_audio);

        // Check if updating firstname and lastname without special permissions results in no change
        $this->assertSame('John', $user->firstname);
        $this->assertSame('Doe', $user->lastname);
        $changes = [
            'firstname'            => 'Max',
            'lastname'             => 'Mustermann',
            'updated_at'           => $user->updated_at,
        ];
        $this->actingAs($user)->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertSuccessful();
        $user->refresh();
        $this->assertSame('John', $user->firstname);
        $this->assertSame('Doe', $user->lastname);

        // Check if updating firstname and lastname with special permissions results in change
        $permission = Permission::firstOrCreate([ 'name' => 'users.updateOwnAttributes' ]);
        $newRole->permissions()->attach($permission->id);
        $changes = [
            'firstname'  => 'Max',
            'lastname'   => 'Mustermann',
            'updated_at' => $user->updated_at,
        ];
        $this->actingAs($user)->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertSuccessful();
        $user->refresh();
        $this->assertSame('Max', $user->firstname);
        $this->assertSame('Mustermann', $user->lastname);
    }

    /**
     * Test if user can change his own email and verify it
     */
    public function testChangeEmail()
    {
        Notification::fake();
        config(['auth.email_change.throttle' => 250]);
        config(['auth.email_change.expire' => 60]);

        $password               = $this->faker->password;
        $otherUserPassword      = $this->faker->password;
        $email                  = $this->faker->email;
        $user                   = User::factory()->create(['password' => Hash::make($password), 'email' => $email]);
        $otherUser              = User::factory()->create(['password' => Hash::make($otherUserPassword)]);
        $externalUser           = User::factory()->create(['authenticator' => 'external']);

        $newEmail = $this->faker->email;
        $changes  = [
            'email'      => $newEmail,
            'updated_at' => $user->updated_at,
        ];

        // Check as unauthenticated user
        $this->putJson(route('api.v1.users.email.change', ['user' => $user]), $changes)
            ->assertUnauthorized();

        // Check as other authenticated user
        $this->actingAs($otherUser)->putJson(route('api.v1.users.email.change', ['user' => $user]), $changes)
            ->assertForbidden();

        // Check without permission to change own email
        $this->actingAs($user)->putJson(route('api.v1.users.email.change', ['user' => $user]), $changes)
            ->assertForbidden();

        // Clear cache (and rate limiter)
        Cache::clear();

        // Give user permission to change own email
        $role       = Role::factory()->create();
        $permission = Permission::firstOrCreate([ 'name' => 'users.updateOwnAttributes' ]);
        $role->permissions()->attach($permission->id);
        $user->roles()->attach($role);
        $otherUser->roles()->attach($role);

        // Check with missing password
        $this->actingAs($user)->putJson(route('api.v1.users.email.change', ['user' => $user]), $changes)
            ->assertJsonValidationErrors(['current_password']);

        // Check with wrong password
        $changes['current_password'] = 'wrong_password';
        $this->actingAs($user)->putJson(route('api.v1.users.email.change', ['user' => $user]), $changes)
            ->assertJsonValidationErrors(['current_password']);

        // Check changing email to existing email of other user
        $changes['email']            = $otherUser->email;
        $changes['current_password'] = $password;
        $this->actingAs($user)->putJson(route('api.v1.users.email.change', ['user' => $user]), $changes)
            ->assertJsonValidationErrors(['email']);

        // Check with correct password
        $changes['email'] = $this->faker->email;
        $this->actingAs($user)->putJson(route('api.v1.users.email.change', ['user' => $user]), $changes)
            ->assertStatus(202);
        $user->refresh();

        // Clear cache (and rate limiter)
        Cache::clear();

        // Check if email can be changed immediately
        $changes['email'] = $this->faker->email;
        $this->actingAs($user)->putJson(route('api.v1.users.email.change', ['user' => $user]), $changes)
            ->assertStatus(CustomStatusCodes::EMAIL_CHANGE_THROTTLE);

        // Check if email can be changed after throttle time
        Carbon::setTestNow(Carbon::now()->addMinutes(6));
        $this->actingAs($user)->putJson(route('api.v1.users.email.change', ['user' => $user]), $changes)
            ->assertStatus(202);

        // Check if email can be changed immediately if throttling is disabled
        config(['auth.email_change.throttle' => 0]);
        $changes['email'] = $newEmail;
        $this->actingAs($user)->putJson(route('api.v1.users.email.change', ['user' => $user]), $changes)
            ->assertStatus(202);

        // Check if email is not changed yet
        $this->assertSame($email, $user->email);

        // Check if validation email was send and get url from email
        $verificationUrl = null;
        Notification::assertSentOnDemand(
            VerifyEmail::class,
            function ($notification, $channels, $notifiable) use ($user, $newEmail, &$verificationUrl) {
                $verificationUrl = $notification->getActionUrl();

                return $notifiable->routes['mail'] === [$newEmail => $user->fullname];
            }
        );
        $query = [];
        parse_str(parse_url($verificationUrl, PHP_URL_QUERY), $query);

        // Try to verify email as unauthenticated user
        Auth::logout();
        $this->postJson(route('api.v1.email.verify'), ['token' => $query['token'], 'email' => $query['email']])
            ->assertUnauthorized();

        // Try to verify email as other authenticated user
        $this->actingAs($otherUser)->postJson(route('api.v1.email.verify'), ['token' => $query['token'], 'email' => $query['email']])
            ->assertStatus(422);

        // Try to verify email as correct user with invalid email
        $this->actingAs($user)->postJson(route('api.v1.email.verify'), ['token' => $query['token'], 'email' => 'test@domain.tld'])
            ->assertUnprocessable();

        // Try to verify email as correct user with invalid token
        $this->actingAs($user)->postJson(route('api.v1.email.verify'), ['token' => '1234', 'email' => $query['email']])
            ->assertUnprocessable();

        // Try to send too many request, trying to guess the token
        // Clear cache (and rate limiter)
        Cache::clear();
        for ($i = 0; $i < 5; $i++) {
            $this->actingAs($user)->postJson(route('api.v1.email.verify'), ['token' => '1234', 'email' => $query['email']])
                ->assertUnprocessable();
        }
        $this->actingAs($user)->postJson(route('api.v1.email.verify'), ['token' => '1234', 'email' => $query['email']])
            ->assertStatus(429);
        // Clear cache (and rate limiter)
        Cache::clear();

        // Try to verify email after expiration time
        Carbon::setTestNow(Carbon::now()->addHour());
        $this->actingAs($user)->postJson(route('api.v1.email.verify'), ['token' => $query['token'], 'email' => $query['email']])
            ->assertUnprocessable();
        Carbon::setTestNow(Carbon::now()->subHour());

        // Try to verify email as correct user
        $this->actingAs($user)->postJson(route('api.v1.email.verify'), ['token' => $query['token'], 'email' => $query['email']])
            ->assertSuccessful();

        // Check if email is changed
        $user->refresh();
        $this->assertSame($newEmail, $user->email);

        // Check if notification is sent to old email
        Notification::assertSentOnDemand(
            EmailChanged::class,
            function ($notification, $channels, $notifiable) use ($user, $email) {
                return $notifiable->routes['mail'] === [$email => $user->fullname];
            }
        );

        // Try to change email with same email
        $changes['email'] = $newEmail;
        Notification::fake();
        $this->actingAs($user)->putJson(route('api.v1.users.email.change', ['user' => $user]), $changes)
            ->assertStatus(200);
        Notification::assertNothingSent();

        // Clear cache (and rate limiter)
        Cache::clear();
        // Check rate limiter for same user and ip
        for ($i = 0; $i < 5; $i++) {
            $this->actingAs($user)->withServerVariables(['REMOTE_ADDR' => '10.1.0.1'])->putJson(route('api.v1.users.email.change', ['user' => $user]), $changes)
                ->assertStatus(200);
        }
        // Check if rate limiter is triggered
        $this->actingAs($user)->withServerVariables(['REMOTE_ADDR' => '10.1.0.1'])->putJson(route('api.v1.users.email.change', ['user' => $user]), $changes)
            ->assertStatus(429);
        // Check if rate limiter is not triggered for different ip
        $this->actingAs($user)->withServerVariables(['REMOTE_ADDR' => '10.1.0.2'])->putJson(route('api.v1.users.email.change', ['user' => $user]), $changes)
            ->assertStatus(200);
        // Check if other user is not affected by rate limiter
        $changes['email']            = $otherUser->email;
        $changes['current_password'] = $otherUserPassword;
        $this->actingAs($otherUser)->withServerVariables(['REMOTE_ADDR' => '10.1.0.1'])->putJson(route('api.v1.users.email.change', ['user' => $otherUser]), $changes)
            ->assertStatus(200);
        Cache::clear();

        // Try to change email for different authenticator
        $user->authenticator    = 'external';
        $user->external_id      = $this->faker->unique()->userName;
        $user->save();
        $this->actingAs($user)->putJson(route('api.v1.users.email.change', ['user' => $user]), $changes)
            ->assertForbidden();
    }

    /**
     * Test if admin can change email of another user without verification
     */
    public function testChangeEmailAdmin()
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        Notification::fake();
        $email = $this->faker->email;
        $user  = User::factory()->create([ 'email' => $email ]);

        $admin = User::factory()->create();
        $admin->roles()->attach(Role::where('name', 'admin')->first());

        $newEmail = $this->faker->email;
        $changes  = [
            'email'      => $newEmail
        ];
        $this->actingAs($admin)->putJson(route('api.v1.users.email.change', ['user' => $user]), $changes)
            ->assertSuccessful();
        $user->refresh();
        $this->assertSame($newEmail, $user->email);

        // Check if notification is sent to old email
        Notification::assertSentOnDemand(
            EmailChanged::class,
            function ($notification, $channels, $notifiable) use ($user, $email) {
                return $notifiable->routes['mail'] === [$email => $user->fullname];
            }
        );

        // Check rate limiter does not affect admin
        for ($i = 0; $i < 10; $i++) {
            $this->actingAs($admin)->putJson(route('api.v1.users.email.change', ['user' => $user]), $changes)
                ->assertSuccessful();
        }

        // Try to change email for user with different authenticator
        $user->authenticator    = 'external';
        $user->external_id      = $this->faker->unique()->userName;
        $user->save();
        $this->actingAs($admin)->putJson(route('api.v1.users.email.change', ['user' => $user]), $changes)
            ->assertForbidden();

        // Check if admin can change own email without verification
        $newAdminEmail = $this->faker->email;
        $changes       = [
            'email'      => $newAdminEmail
        ];
        $this->actingAs($admin)->putJson(route('api.v1.users.email.change', ['user' => $admin]), $changes)
            ->assertJsonValidationErrors('current_password');
    }

    /**
     * Test if user can change his own password
     */
    public function testChangePassword()
    {
        Notification::fake();
        setting(['password_self_reset_enabled' => false]);

        $password    = $this->faker->password;
        $newPassword = '!SuperSecretPassword123';
        $user        = User::factory()->create(['password' => Hash::make($password)]);
        $otherUser   = User::factory()->create(['password' => Hash::make($newPassword)]);

        $changes = [
            'new_password'              => $newPassword,
            'new_password_confirmation' => $newPassword,
        ];

        // Check as unauthenticated user
        $this->putJson(route('api.v1.users.password.change', ['user' => $user]), $changes)
            ->assertUnauthorized();

        // Check as other authenticated user
        $this->actingAs($otherUser)->putJson(route('api.v1.users.password.change', ['user' => $user]), $changes)
            ->assertForbidden();

        // Check without permission to change own password
        $this->actingAs($user)->putJson(route('api.v1.users.password.change', ['user' => $user]), $changes)
            ->assertForbidden();

        // Give user permission to change own password
        setting(['password_self_reset_enabled' => true]);

        // Check with missing password
        $this->actingAs($user)->putJson(route('api.v1.users.password.change', ['user' => $user]), $changes)
            ->assertJsonValidationErrors('current_password');

        // Check with wrong password
        $changes['current_password'] = 'wrong_password';
        $this->actingAs($user)->putJson(route('api.v1.users.password.change', ['user' => $user]), $changes)
            ->assertJsonValidationErrors('current_password');

        // Check with invalid password confirmation
        $changes['current_password']          = $password;
        $changes['new_password_confirmation'] = 'wrong_password';
        $this->actingAs($user)->putJson(route('api.v1.users.password.change', ['user' => $user]), $changes)
            ->assertJsonValidationErrors('new_password');

        // Check with correct password confirmation
        $changes['new_password_confirmation'] = $newPassword;

        // Create new sessions in database
        $currentSession                = new Session();
        $currentSession->id            = $this->app['session']->getId();
        $currentSession->user_agent    = $this->faker->userAgent;
        $currentSession->ip_address    = $this->faker->ipv4;
        $currentSession->payload       = '';
        $currentSession->last_activity = now();
        $currentSession->user()->associate($user);
        $currentSession->save();

        $otherSession                = new Session();
        $otherSession->id            = \Str::random(40);
        $otherSession->user_agent    = $this->faker->userAgent;
        $otherSession->ip_address    = $this->faker->ipv4;
        $otherSession->payload       = '';
        $otherSession->last_activity = now();
        $otherSession->user()->associate($user);
        $otherSession->save();

        $otherUserSession                = new Session();
        $otherUserSession->id            = \Str::random(40);
        $otherUserSession->user_agent    = $this->faker->userAgent;
        $otherUserSession->ip_address    = $this->faker->ipv4;
        $otherUserSession->payload       = '';
        $otherUserSession->last_activity = now();
        $otherUserSession->user()->associate($otherUser);
        $otherUserSession->save();

        // Check with correct password
        $this->actingAs($user)->putJson(route('api.v1.users.password.change', ['user' => $user]), $changes)
            ->assertSuccessful();

        // Check if password is changed
        $user->refresh();
        $this->assertTrue(Hash::check($newPassword, $user->password));

        // Check if other sessions are deleted, but not the current one or of other users
        $this->assertNotNull(Session::find($currentSession->id));
        $this->assertNull(Session::find($otherSession->id));
        $this->assertNotNull(Session::find($otherUserSession->id));

        // Check if notification is sent to user
        Notification::assertSentTo($user, PasswordChanged::class);

        // Clear cache (and rate limiter)
        Cache::clear();
        $changes['current_password']          = $newPassword;
        $changes['new_password']              = $newPassword;
        $changes['new_password_confirmation'] = $newPassword;

        // Check rate limiter for same user and ip
        for ($i = 0; $i < 5; $i++) {
            $this->actingAs($user)->withServerVariables(['REMOTE_ADDR' => '10.1.0.1'])->putJson(route('api.v1.users.password.change', ['user' => $user]), $changes)
                ->assertStatus(200);
        }
        // Check if rate limiter is triggered
        $this->actingAs($user)->withServerVariables(['REMOTE_ADDR' => '10.1.0.1'])->putJson(route('api.v1.users.password.change', ['user' => $user]), $changes)
            ->assertStatus(429);
        // Check if rate limiter is not triggered for different ip
        $this->actingAs($user)->withServerVariables(['REMOTE_ADDR' => '10.1.0.2'])->putJson(route('api.v1.users.password.change', ['user' => $user]), $changes)
            ->assertStatus(200);
        // Check if other user is not affected by rate limiter
        $this->actingAs($otherUser)->withServerVariables(['REMOTE_ADDR' => '10.1.0.1'])->putJson(route('api.v1.users.password.change', ['user' => $otherUser]), $changes)
            ->assertStatus(200);
        Cache::clear();

        // Try to change password for user with different authenticator
        $user->authenticator    = 'external';
        $user->external_id      = $this->faker->unique()->userName;
        $user->save();
        $this->actingAs($user)->putJson(route('api.v1.users.password.change', ['user' => $user]), $changes)
            ->assertForbidden();
    }

    /**
     * Test if admin can change password of another user
     */
    public function testChangePasswordAdmin()
    {
        Notification::fake();
        setting(['password_self_reset_enabled' => false]);
        $this->seed(RolesAndPermissionsSeeder::class);

        $newPassword = '!SuperSecretPassword123';
        $user        = User::factory()->create();
        $otherUser   = User::factory()->create();

        // Create admin user
        $admin = User::factory()->create();
        $admin->roles()->attach(Role::where('name', 'admin')->first());

        $changes = [];

        // Check with empty password
        $this->actingAs($admin)->putJson(route('api.v1.users.password.change', ['user' => $user]), $changes)
            ->assertJsonValidationErrors('new_password');

        // Check with invalid password confirmation
        $changes['new_password']              = $newPassword;
        $changes['new_password_confirmation'] = 'wrong_password';
        $this->actingAs($admin)->putJson(route('api.v1.users.password.change', ['user' => $user]), $changes)
            ->assertJsonValidationErrors('new_password');

        // Create new sessions in database
        $adminSession                = new Session();
        $adminSession->id            = $this->app['session']->getId();
        $adminSession->user_agent    = $this->faker->userAgent;
        $adminSession->ip_address    = $this->faker->ipv4;
        $adminSession->payload       = '';
        $adminSession->last_activity = now();
        $adminSession->user()->associate($admin);
        $adminSession->save();

        $otherAdminSession                = new Session();
        $otherAdminSession->id            = \Str::random(40);
        $otherAdminSession->user_agent    = $this->faker->userAgent;
        $otherAdminSession->ip_address    = $this->faker->ipv4;
        $otherAdminSession->payload       = '';
        $otherAdminSession->last_activity = now();
        $otherAdminSession->user()->associate($admin);
        $otherAdminSession->save();

        $userSession                = new Session();
        $userSession->id            = \Str::random(40);
        $userSession->user_agent    = $this->faker->userAgent;
        $userSession->ip_address    = $this->faker->ipv4;
        $userSession->payload       = '';
        $userSession->last_activity = now();
        $userSession->user()->associate($user);
        $userSession->save();

        $otherUserSession                = new Session();
        $otherUserSession->id            = \Str::random(40);
        $otherUserSession->user_agent    = $this->faker->userAgent;
        $otherUserSession->ip_address    = $this->faker->ipv4;
        $otherUserSession->payload       = '';
        $otherUserSession->last_activity = now();
        $otherUserSession->user()->associate($otherUser);
        $otherUserSession->save();

        // Check with correct password confirmation
        $changes['new_password_confirmation'] = $newPassword;
        $this->actingAs($admin)->putJson(route('api.v1.users.password.change', ['user' => $user]), $changes)
            ->assertSuccessful();

        // Check if password is changed
        $user->refresh();
        $this->assertTrue(Hash::check($newPassword, $user->password));

        // Check if only sessions of the user are deleted, but not of the admin or other users
        $this->assertNotNull(Session::find($adminSession->id));
        $this->assertNotNull(Session::find($otherAdminSession->id));
        $this->assertNull(Session::find($userSession->id));
        $this->assertNotNull(Session::find($otherUserSession->id));

        // Check if notification is sent to user
        Notification::assertSentTo($user, PasswordChanged::class);

        // Check rate limiter does not affect admin
        for ($i = 0; $i < 10; $i++) {
            $this->actingAs($admin)->putJson(route('api.v1.users.password.change', ['user' => $user]), $changes)
                ->assertSuccessful();
        }

        // Try to change password for user with different authenticator
        $user->authenticator    = 'external';
        $user->external_id      = $this->faker->unique()->userName;
        $user->save();
        $this->actingAs($admin)->putJson(route('api.v1.users.password.change', ['user' => $user]), $changes)
            ->assertForbidden();

        // Check if admin cannot change own password if self reset is disabled
        $changes = [
            'new_password'              => $newPassword,
            'new_password_confirmation' => $newPassword,
        ];
        $this->actingAs($admin)->putJson(route('api.v1.users.password.change', ['user' => $admin]), $changes)
            ->assertForbidden();

        // Check if admin can change own password if self reset is enabled, but also has to provide current password
        setting(['password_self_reset_enabled' => true]);
        $this->actingAs($admin)->putJson(route('api.v1.users.password.change', ['user' => $admin]), $changes)
            ->assertJsonValidationErrors('current_password');
    }

    public function testUpdateNewImage()
    {
        config([
            'app.available_locales' => ['fr', 'es', 'be', 'de', 'en', 'ru'],
        ]);

        $user       = User::factory()->create(['locale' => 'de', 'timezone' => 'Europe/Berlin' ,'bbb_skip_check_audio' => false]);
        $role       = Role::factory()->create(['default' => true]);
        $permission = Permission::firstOrCreate([ 'name' => 'users.delete' ]);
        $role->permissions()->attach($permission->id);
        $role->users()->attach([$user->id]);

        $changes = [
            'firstname'            => $user->firstname,
            'lastname'             => $user->lastname,
            'email'                => $user->email,
            'roles'                => [$role->id],
            'user_locale'          => $user->locale,
            'bbb_skip_check_audio' => $user->bbb_skip_check_audio,
            'timezone'             => $user->timezone,
            'image'                => 'test',
            'updated_at'           => $user->updated_at,
        ];

        // Try with invalid type, string not image
        $this->actingAs($user)->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['image']);

        // Try with wrong dimensions
        $changes['image'] = UploadedFile::fake()->image('avatar.jpg', 200, 200);
        $this->actingAs($user)->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['image']);

        // Try with wrong file type, only jpeg is allowed
        $changes['image'] = UploadedFile::fake()->image('avatar.png', 100, 100);
        $this->actingAs($user)->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['image']);

        // Create fake storage disk
        Storage::fake('public');

        // Create fake files
        $file  = UploadedFile::fake()->image('avatar.jpg', 100, 100);
        $file2 = UploadedFile::fake()->image('avatar2.jpg', 100, 100);
        $path  = 'profile_images/'.$file->hashName();
        $path2 = 'profile_images/'.$file2->hashName();

        // Upload first image
        $changes['image'] = $file;
        $this->actingAs($user)->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertSuccessful();

        // Check if image exists on drive
        Storage::disk('public')->assertExists($path);

        // Check if database is updated
        $user->refresh();
        $this->assertEquals($path, $user->image);

        // Upload a new image
        $changes['image']      = $file2;
        $changes['updated_at'] = $user->updated_at;
        $this->actingAs($user)->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertSuccessful();

        // Check if new image was saved
        Storage::disk('public')->assertExists($path2);

        // Check if database is updated
        $user->refresh();
        $this->assertEquals($path2, $user->image);

        // Check if old image was deleted
        Storage::disk('public')->assertMissing($path);

        // Delete image
        $changes['image']      = null;
        $changes['updated_at'] = $user->updated_at;
        $this->actingAs($user)->putJson(route('api.v1.users.update', ['user' => $user]), $changes)
            ->assertSuccessful();

        // Check if image was deleted
        Storage::disk('public')->assertMissing($path2);

        // Check if database is updated
        $user->refresh();
        $this->assertNull($user->image);
    }

    public function testShow()
    {
        $user = User::factory()->create();

        $externalUser = User::factory()->create([
            'external_id'   => $this->faker->unique()->userName,
            'authenticator' => 'external',
            'email'         => $this->faker->unique()->safeEmail,
            'firstname'     => $this->faker->firstName,
            'lastname'      => $this->faker->lastName
        ]);

        $this->assertDatabaseCount('users', 2);

        // Unauthenticated user
        $this->getJson(route('api.v1.users.show', ['user' => $externalUser]))->assertUnauthorized();

        // User without permission other user
        $this->actingAs($user)->getJson(route('api.v1.users.show', ['user' => $externalUser]))
            ->assertForbidden();

        // User without permission own user
        $this->actingAs($user)->getJson(route('api.v1.users.show', ['user' => $user]))
            ->assertSuccessful()
            ->assertJsonFragment([
                'firstname'     => $user->firstname,
                'lastname'      => $user->lastname,
                'authenticator' => 'local',
                'image'         => null,
            ]);

        // Not existing user
        $role = Role::factory()->create(['default' => true]);

        $permission = Permission::firstOrCreate([ 'name' => 'users.view' ]);
        $role->permissions()->attach($permission->id);

        $role->users()->attach([$externalUser->id, $user->id]);

        $this->actingAs($user)->getJson(route('api.v1.users.show', ['user' => self::INVALID_USER_ID]))
            ->assertNotFound();

        // Existing user
        $this->actingAs($user)->getJson(route('api.v1.users.show', ['user' => $externalUser]))
            ->assertSuccessful()
            ->assertJsonFragment([
                'firstname'     => $externalUser->firstname,
                'lastname'      => $externalUser->lastname,
                'authenticator' => 'external',
                'roles'         => [['id' => $role->id, 'name' => $role->name, 'automatic' => false]]
            ]);

        // Check user image path
        $user->image = 'test.jpg';
        $user->save();
        $this->actingAs($user)->getJson(route('api.v1.users.show', ['user' => $user]))
            ->assertSuccessful()
            ->assertJsonFragment([
                'firstname'     => $user->firstname,
                'lastname'      => $user->lastname,
                'authenticator' => 'local',
                'image'         => $user->imageUrl,
            ]);
    }

    public function testDelete()
    {
        $userToDelete = User::factory()->create();
        $user         = User::factory()->create();

        $externalUser = User::factory()->create([
            'external_id'   => $this->faker->unique()->userName,
            'authenticator' => 'external',
            'email'         => $this->faker->unique()->safeEmail,
            'firstname'     => $this->faker->firstName,
            'lastname'      => $this->faker->lastName
        ]);

        $this->assertDatabaseCount('users', 3);

        // Unauthenticated user
        $this->deleteJson(route('api.v1.users.destroy', ['user' => $userToDelete]))->assertUnauthorized();

        // User without permission
        $this->actingAs($user)->deleteJson(route('api.v1.users.destroy', ['user' => $userToDelete]))
            ->assertForbidden();

        // Not existing model
        $this->actingAs($user)->deleteJson(route('api.v1.users.destroy', ['user' => self::INVALID_USER_ID]))->assertNotFound();

        // User own model
        $this->actingAs($user)->deleteJson(route('api.v1.users.destroy', ['user' => $user]))
            ->assertForbidden();

        // User other model
        $role = Role::factory()->create(['default' => true]);
        $role->users()->attach([$userToDelete->id, $user->id]);

        $permission = Permission::firstOrCreate([ 'name' => 'users.delete' ]);
        $role->permissions()->attach($permission->id);

        $this->actingAs($user)->deleteJson(route('api.v1.users.destroy', ['user' => $userToDelete]))
            ->assertNoContent();

        $this->actingAs($user)->deleteJson(route('api.v1.users.destroy', ['user' => $externalUser]))
            ->assertNoContent();

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('role_user', 1);
    }

    public function testResetPassword()
    {
        $resetUser = User::factory()->create([
            'initial_password_set' => true,
            'authenticator'        => 'external',
            'locale'               => 'de'
        ]);
        $user = User::factory()->create();

        $this->postJson(route('api.v1.users.password.reset', ['user' => $resetUser]))
            ->assertUnauthorized();

        $this->actingAs($user)->postJson(route('api.v1.users.password.reset', ['user' => $resetUser]))
            ->assertForbidden();

        $role = Role::factory()->create(['default' => true]);

        $permission = Permission::firstOrCreate([ 'name' => 'users.update' ]);
        $role->permissions()->attach($permission->id);

        $role->users()->attach([$user->id]);

        $this->actingAs($user)->postJson(route('api.v1.users.password.reset', ['user' => self::INVALID_USER_ID]))
            ->assertNotFound();

        $this->actingAs($user)->postJson(route('api.v1.users.password.reset', ['user' => $user]))
            ->assertForbidden();

        $resetUser->initial_password_set = false;
        $resetUser->save();
        $this->actingAs($user)->postJson(route('api.v1.users.password.reset', ['user' => $resetUser]))
            ->assertForbidden();

        Notification::fake();
        $resetUser->authenticator = 'local';
        $resetUser->save();
        $this->actingAs($user)->postJson(route('api.v1.users.password.reset', ['user' => $resetUser]))
            ->assertSuccessful();
        $resetUrl = '';
        Notification::assertSentTo($resetUser, PasswordReset::class);

        // Check if requesting reset immediately after another reset request is not possible
        Notification::fake();
        $this->actingAs($user)->postJson(route('api.v1.users.password.reset', ['user' => $resetUser]))
            ->assertStatus(CustomStatusCodes::PASSWORD_RESET_FAILED);
        Notification::assertNotSentTo($resetUser, PasswordReset::class);
    }

    public function testCreateUserWithGeneratedPassword()
    {
        $user = User::factory()->create();
        $role = Role::factory()->create(['default' => true]);

        $permission = Permission::firstOrCreate([ 'name' => 'users.create' ]);
        $role->permissions()->attach($permission->id);

        $role->users()->attach([$user->id]);

        Notification::fake();
        $response = $this->actingAs($user)->postJson(route('api.v1.users.store', [
            'firstname'             => $this->faker->firstName,
            'lastname'              => $this->faker->lastName,
            'user_locale'           => 'de',
            'email'                 => $this->faker->email,
            'generate_password'     => true,
            'roles'                 => [$role->id],
            'authenticator'         => 'local',
            'bbb_skip_check_audio'  => false,
            'timezone'              => 'UTC'
        ]))
            ->assertSuccessful();
        $newUser = User::find($response->json('data.id'));
        Notification::assertSentTo($newUser, UserWelcome::class);
    }
}
