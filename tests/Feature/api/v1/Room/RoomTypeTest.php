<?php

namespace Tests\Feature\api\v1\Room;

use App\Enums\CustomStatusCodes;
use App\Permission;
use App\Role;
use App\Room;
use App\RoomType;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

/**
 * General room types api feature tests
 * @package Tests\Feature\api\v1\RoomType
 */
class RoomTypeTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;

    /**
     * Setup ressources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed('RolesAndPermissionsSeeder');
        $this->user = factory(User::class)->create();
    }

    /**
     * Test to get a list of all room types
     */
    public function testIndex()
    {
        $roomType = factory(RoomType::class)->create();

        // Test guests
        $this->getJson(route('api.v1.roomTypes.index'))
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.index'))
            ->assertSuccessful()
            ->assertJsonFragment(
                ['id' => $roomType->id,'short'=>$roomType->short,'description'=>$roomType->description,'color'=>$roomType->color]
            );
    }

    /**
     * Test to view single room type
     */
    public function testShow()
    {
        $roomType = factory(RoomType::class)->create();

        // Test guests
        $this->getJson(route('api.v1.roomTypes.show', ['roomType' => $roomType->id]))
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.show', ['roomType' => $roomType->id]))
            ->assertForbidden();

        // Authorize user
        $role       = factory(Role::class)->create();
        $permission = Permission::firstOrCreate([ 'name' => 'roomTypes.view' ]);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test with authorized user
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.show', ['roomType' => $roomType->id]))
            ->assertSuccessful()
            ->assertJsonFragment(
                ['id' => $roomType->id,'short'=>$roomType->short,'description'=>$roomType->description,'color'=>$roomType->color]
            );

        // Test deleted
        $roomType->delete();
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.show', ['roomType' => $roomType->id]))
            ->assertNotFound();
    }

    /**
     * Test to create new room type
     */
    public function testCreate()
    {
        $roomType = factory(RoomType::class)->make();

        $data = ['short'=>$roomType->short,'color'=>$roomType->color,'description'=>$roomType->description,'server_pool'=>$roomType->serverPool->id];

        // Test guests
        $this->postJson(route('api.v1.roomTypes.store'), $data)
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->postJson(route('api.v1.roomTypes.store'), $data)
            ->assertForbidden();

        // Authorize user
        $role       = factory(Role::class)->create();
        $permission = Permission::firstOrCreate([ 'name' => 'roomTypes.create']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test with authorized user
        $this->actingAs($this->user)->postJson(route('api.v1.roomTypes.store'), $data)
            ->assertSuccessful()
            ->assertJsonFragment(
                ['short'=>$roomType->short,'description'=>$roomType->description,'color'=>$roomType->color]
            );

        // Test with some short as existing room type
        $this->actingAs($this->user)->postJson(route('api.v1.roomTypes.store'), $data)
            ->assertJsonValidationErrors(['short']);

        // Test with invalid data
        $data = ['short'=>'TEST','color'=>'rgb(255,255,255)','description'=>'','server_pool'=>''];
        $this->actingAs($this->user)->postJson(route('api.v1.roomTypes.store'), $data)
            ->assertJsonValidationErrors(['short','color','description']);
    }

    /**
     * Test to update a room type
     */
    public function testUpdate()
    {
        $roomType  = factory(RoomType::class)->create();
        $roomType2 = factory(RoomType::class)->create();

        $data = ['short'=>$roomType->short,'color'=>$roomType->color,'description'=>$roomType->description,'server_pool'=>$roomType->serverPool->id];

        // Test guests
        $this->putJson(route('api.v1.roomTypes.update', ['roomType'=>$roomType->id]), $data)
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->putJson(route('api.v1.roomTypes.update', ['roomType'=>$roomType->id]), $data)
            ->assertForbidden();

        // Authorize user
        $role       = factory(Role::class)->create();
        $permission = Permission::firstOrCreate([ 'name' => 'roomTypes.update' ]);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test with authorized user, without updated at
        $this->actingAs($this->user)->putJson(route('api.v1.roomTypes.update', ['roomType'=>$roomType->id]), $data)
            ->assertStatus(CustomStatusCodes::STALE_MODEL);

        $data['updated_at'] = $roomType->updated_at;

        // Test with authorized user, with updated at
        $this->actingAs($this->user)->putJson(route('api.v1.roomTypes.update', ['roomType'=>$roomType->id]), $data)
            ->assertSuccessful()
            ->assertJsonFragment(
                ['short'=>$roomType->short,'description'=>$roomType->description,'color'=>$roomType->color]
            );

        // Test with short of an other room type
        $roomType->refresh();
        $data['short']      = $roomType2->short;
        $data['updated_at'] = $roomType->updated_at;
        $this->actingAs($this->user)->putJson(route('api.v1.roomTypes.update', ['roomType'=>$roomType->id]), $data)
            ->assertJsonValidationErrors(['short']);

        // Test with invalid data
        $roomType->refresh();
        $data = ['short'=>'TEST','color'=>'rgb(255,255,255)','description'=>'','server_pool'=>'','updated_at'=>$roomType->updated_at];
        $this->actingAs($this->user)->putJson(route('api.v1.roomTypes.update', ['roomType'=>$roomType->id]), $data)
            ->assertJsonValidationErrors(['short','color','description']);

        // Test deleted
        $roomType->delete();
        $this->actingAs($this->user)->putJson(route('api.v1.roomTypes.update', ['roomType'=>$roomType->id]), $data)
            ->assertNotFound();
    }

    /**
     * Test to delete a room type
     */
    public function testDelete()
    {
        $roomType = factory(RoomType::class)->create();

        // Test guests
        $this->deleteJson(route('api.v1.roomTypes.destroy', ['roomType'=>$roomType->id]))
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->deleteJson(route('api.v1.roomTypes.destroy', ['roomType'=>$roomType->id]))
            ->assertForbidden();

        // Authorize user
        $role       = factory(Role::class)->create();
        $permission = Permission::firstOrCreate([ 'name' => 'roomTypes.delete' ]);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test delete for room type without rooms attached
        $this->actingAs($this->user)->deleteJson(route('api.v1.roomTypes.destroy', ['roomType'=>$roomType->id]))
            ->assertSuccessful();

        // Test delete again
        $this->actingAs($this->user)->deleteJson(route('api.v1.roomTypes.destroy', ['roomType'=>$roomType->id]))
            ->assertNotFound();

        $this->assertDatabaseMissing('room_types', ['id'=>$roomType->id]);

        // Create new rooms
        $room = factory(Room::class)->create();

        // Test delete for room type with room attached
        $this->actingAs($this->user)->deleteJson(route('api.v1.roomTypes.destroy', ['roomType'=>$room->roomType->id]))
            ->assertJsonValidationErrors(['replacement_room_type']);

        // Test with replacement own room
        $this->actingAs($this->user)->deleteJson(route('api.v1.roomTypes.destroy', ['roomType'=>$room->roomType->id]), ['replacement_room_type'=>$room->roomType->id])
            ->assertJsonValidationErrors(['replacement_room_type']);

        // Test with invalid replacement
        $this->actingAs($this->user)->deleteJson(route('api.v1.roomTypes.destroy', ['roomType'=>$room->roomType->id]), ['replacement_room_type'=>'0'])
            ->assertJsonValidationErrors(['replacement_room_type']);

        $newRoomType = factory(RoomType::class)->create();

        // Test with valid replacement
        $this->actingAs($this->user)->deleteJson(route('api.v1.roomTypes.destroy', ['roomType'=>$room->roomType->id]), ['replacement_room_type'=>$newRoomType->id])
            ->assertSuccessful();

        // Check if room was moved to new room type
        $room->refresh();
        $this->assertTrue($room->roomType->is($newRoomType));
    }
}
