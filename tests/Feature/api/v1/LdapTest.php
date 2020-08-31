<?php

namespace Tests\Feature\api\v1;

use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use LdapRecord\ContainerException;
use LdapRecord\Laravel\Testing\DirectoryEmulator;
use LdapRecord\Models\OpenLDAP\User;
use Tests\TestCase;

class LdapTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * Test that get a single ldap data with valid UID
     * @throws ContainerException
     * @throws Exception
     */
    public function testGetLdapWithValidUID()
    {
        $user = factory(\App\User::class)->create();

        DirectoryEmulator::setup('default');

        $ldap = User::create([
            'uid'       => 'mstt',
            'mail'      => 'max@local.com',
            'cn'        => 'Max',
            'givenname' => 'Max Mustermann',
            'sn'        => 'Mustermann'
        ]);

        $response = $this->actingAs($user)->get(route('api.v1.ldap.show', 'mstt'));

        $response->assertStatus(200);
    }

    /**
     * Test that get a single ldap data with invalid UID
     * @throws ContainerException
     * @throws Exception
     */
    public function testGetLdapWithInvalidUID()
    {
        $user = factory(\App\User::class)->create();

        DirectoryEmulator::setup('default');

        $ldap = User::create([
            'uid'       => 'mstt',
            'mail'      => 'max@local.com',
            'cn'        => 'Max',
            'givenname' => 'Max Mustermann',
            'sn'        => 'Mustermann'
        ]);

        $response = $this->actingAs($user)->get(route('api.v1.ldap.show', 'mst'));

        $response->assertStatus(404);
    }

    /**
     * Test that delete ldap data with a valid UID
     *
     * @return void
     * @throws Exception
     */
    public function testDeleteLdapWithValidUID()
    {
        $user = factory(\App\User::class)->create();

        DirectoryEmulator::setup('default');

        $ldap = User::create([
            'uid'       => 'mstt',
            'mail'      => 'max@local.com',
            'cn'        => 'Max',
            'givenname' => 'Max Mustermann',
            'sn'        => 'Mustermann'
        ]);

        $response = $this->actingAs($user)->deleteJson(route('api.v1.ldap.destroy', 'mstt'));

        $response->assertStatus(204);
    }

    /**
     * Test that delete ldap data with an invalid UID
     *
     * @return void
     * @throws ContainerException
     * @throws Exception
     */
    public function testDeleteLdapWithInvalidUID()
    {
        $user = factory(\App\User::class)->create();

        DirectoryEmulator::setup('default');

        $ldap = User::create([
            'uid'       => 'mstt',
            'mail'      => 'max@local.com',
            'cn'        => 'Max',
            'givenname' => 'Max Mustermann',
            'sn'        => 'Mustermann'
        ]);

        $response = $this->actingAs($user)->deleteJson(route('api.v1.ldap.destroy', 'mst'));

        $response->assertStatus(404);
    }

    /**
     * Test that update user with valid inputs and valid UID
     *
     * @return void
     */
    public function testUpdateLdapWithValidInputsAndValidUID()
    {
        $user = factory(\App\User::class)->create();

        DirectoryEmulator::setup('default');

        $ldap = User::create([
            'uid'       => 'mstt',
            'mail'      => 'max@local.com',
            'cn'        => 'Max',
            'givenname' => 'Max Mustermann',
            'sn'        => 'Mustermann'
        ]);

        $response = $this->actingAs($user)->putJson(route('api.v1.ldap.update', 'mstt'), [
            'mail'      => 'update@mail.com',
            'cn'        => 'updatemax',
            'givenname' => 'updatemaxmustermann',
            'sn'        => 'updatemustermann'
        ]);

        $response->assertStatus(202);
        $response->assertJson([
            'uid'         => ['mstt'],
            'mail'        => ['update@mail.com'],
            'cn'          => ['updatemax'],
            'givenname'   => ['updatemaxmustermann'],
            'sn'          => ['updatemustermann'],
            'objectclass' => [
                'top',
                'person',
                'organizationalperson',
                'inetorgperson'
            ]
        ]);
    }

    /**
     * Test that update user with valid inputs and invalid user id
     *
     * @return void
     */
    public function testUpdateLdapWithValidInputsAndInvalidUID()
    {
        $user = factory(\App\User::class)->create();

        DirectoryEmulator::setup('default');

        $ldap = User::create([
            'uid'       => 'mstt',
            'mail'      => 'max@local.com',
            'cn'        => 'Max',
            'givenname' => 'Max Mustermann',
            'sn'        => 'Mustermann'
        ]);

        $response = $this->actingAs($user)->putJson(route('api.v1.ldap.update', 'mst'), [
            'mail'      => 'update@mail.com',
            'cn'        => 'updatemax',
            'givenname' => 'updatemaxmustermann',
            'sn'        => 'updatemustermann'
        ]);

        $response->assertStatus(404);
    }

    /**
     * Test that update user with invalid inputs and valid user id
     *
     * @return void
     */
    public function testUpdateLdapWithInvalidInputsAndValidUID()
    {
        $user = factory(\App\User::class)->create();

        DirectoryEmulator::setup('default');

        $ldap = User::create([
            'uid'       => 'mstt',
            'mail'      => 'max@local.com',
            'cn'        => 'Max',
            'givenname' => 'Max Mustermann',
            'sn'        => 'Mustermann'
        ]);

        $response = $this->actingAs($user)->putJson(route('api.v1.ldap.update', 'mstt'), [
            'mail'      => 'update@mail.com',
            'cn'        => 'updatemax',
            'givenname' => 'updatemaxmustermann'
        ]);

        $response->assertStatus(422);
    }
}
