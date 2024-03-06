<?php

namespace Tests\Feature\api\v1\Room;

use App\Enums\CustomStatusCodes;
use App\Enums\RoomUserRole;
use App\Http\Resources\RoleCollection;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
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
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->user = User::factory()->create();
    }

    /**
     * Test to get a list of all room types
     */
    public function testIndex()
    {
        RoomType::query()->delete();
        $roomType  = RoomType::factory()->create();
        $roomType1 = RoomType::factory()->create([
            'restrict' => true
        ]);
        $roomType2 = RoomType::factory()->create([
            'restrict' => true
        ]);
        $roomTypeListed = RoomType::factory()->create([
            'allow_listing' => true
        ]);

        $role1 = Role::factory()->create();
        $role2 = Role::factory()->create();

        $roomType1->roles()->sync([$role1->id]);
        $roomType2->roles()->sync([$role2->id]);

        $room = Room::factory()->create([
            'room_type_id' => $roomType1->id
        ]);

        // Test guests
        $this->getJson(route('api.v1.roomTypes.index'))
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.index'))
            ->assertSuccessful()
            ->assertJsonStructure(['data' => [
                '*' => [
                    'allow_listing',
                    'color',
                    'name',
                    'id',
                    'model_name',
                    'restrict',
                    'updated_at'
                ]
            ]])
            ->assertJsonCount(4, 'data');

        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.index', ['filter' => 'own']))
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(
                ['id' => $roomType->id,'name'=>$roomType->name,'color'=>$roomType->color]
            )
            ->assertJsonFragment(
                ['id' => $roomTypeListed->id,'name'=>$roomTypeListed->name,'color'=>$roomTypeListed->color]
            );

        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.index', ['filter' => 1337]))
            ->assertForbidden();

        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.index', ['filter' => $room->id]))
            ->assertForbidden();

        $room->members()->attach($this->user, ['role' => RoomUserRole::CO_OWNER]);
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.index', ['filter' => $room->id]))
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(
                ['id' => $roomType->id,'name'=>$roomType->name,'color'=>$roomType->color]
            )
            ->assertJsonFragment(
                ['id' => $roomTypeListed->id,'name'=>$roomTypeListed->name,'color'=>$roomTypeListed->color]
            );

        $this->user->roles()->attach([$role1->id]);
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.index', ['filter' => $room->id]))
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(
                ['id' => $roomType->id,'name'=>$roomType->name,'color'=>$roomType->color]
            )
            ->assertJsonFragment(
                ['id' => $roomTypeListed->id,'name'=>$roomTypeListed->name,'color'=>$roomTypeListed->color]
            );

        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.index', ['filter' => 'searchable']))
            ->assertSuccessful()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(
                ['id' => $roomTypeListed->id,'name'=>$roomTypeListed->name,'color'=>$roomTypeListed->color]
            );

        $room->owner->roles()->attach([$role1->id, $role2->id]);
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.index', ['filter' => $room->id]))
            ->assertSuccessful()
            ->assertJsonCount(4, 'data');
    }

    /**
     * Test to view single room type
     */
    public function testShow()
    {
        $roomType = RoomType::factory()->create();

        // Test guests
        $this->getJson(route('api.v1.roomTypes.show', ['roomType' => $roomType->id]))
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.show', ['roomType' => $roomType->id]))
            ->assertForbidden();

        // Authorize user
        $role       = Role::factory()->create();
        $permission = Permission::firstOrCreate([ 'name' => 'roomTypes.view' ]);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test with authorized user
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.show', ['roomType' => $roomType->id]))
            ->assertSuccessful()
            ->assertJsonFragment(
                ['id' => $roomType->id,'name'=>$roomType->name,'color'=>$roomType->color]
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
        $roomType = RoomType::factory()->make();
        $role1    = Role::factory()->create();

        $data = [
            'name'                    => $roomType->name,
            'color'                   => $roomType->color,
            'server_pool'             => $roomType->serverPool->id,
            'restrict'                => true,
            'roles'                   => [$role1->id],
            'require_access_code'     => false,
            'allow_listing'           => 0,
            'allow_record_attendance' => true,
            'max_duration'            => 90,
            'max_participants'        => 30
        ];

        // Test guests
        $this->postJson(route('api.v1.roomTypes.store'), $data)
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->postJson(route('api.v1.roomTypes.store'), $data)
            ->assertForbidden();

        // Authorize user
        $role       = Role::factory()->create();
        $permission = Permission::firstOrCreate([ 'name' => 'roomTypes.create']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test with authorized user
        $this->actingAs($this->user)->postJson(route('api.v1.roomTypes.store'), $data)
            ->assertSuccessful()
            ->assertJsonFragment([
                'name'                    => $roomType->name,
                'color'                   => $roomType->color,
                'allow_listing'           => false,
                'restrict'                => true,
                'roles'                   => new RoleCollection([$role1]),
                'require_access_code'     => false,
                'allow_record_attendance' => true,
                'max_duration'            => 90,
                'max_participants'        => 30
            ]);

        // Test with invalid data
        $data = ['color'=>'rgb(255,255,255)','name'=>'','server_pool'=>'','allow_listing'=>'ok', 'restrict' => true, 'require_access_code' => 'no', 'allow_record_attendance' => 'yes', 'max_duration' => -1, 'max_participants' => -1];
        $this->actingAs($this->user)->postJson(route('api.v1.roomTypes.store'), $data)
            ->assertJsonValidationErrors(['color','name','allow_listing', 'roles', 'max_duration', 'max_participants', 'require_access_code', 'allow_record_attendance']);

        $data['roles'] = [1337];
        $this->actingAs($this->user)->postJson(route('api.v1.roomTypes.store'), $data)
            ->assertJsonValidationErrors(['color','name','allow_listing', 'roles.0']);
    }

    /**
     * Test to update a room type
     */
    public function testUpdate()
    {
        $roomType  = RoomType::factory()->create();
        $role1     = Role::factory()->create();

        $data = [
            'name'                    => $roomType->name,
            'color'                   => $roomType->color,
            'server_pool'             => $roomType->serverPool->id,
            'restrict'                => false,
            'roles'                   => [$role1->id],
            'allow_listing'           => 1,
            'require_access_code'     => false,
            'allow_record_attendance' => true,
            'max_duration'            => 90,
            'max_participants'        => 30
        ];

        // Test guests
        $this->putJson(route('api.v1.roomTypes.update', ['roomType'=>$roomType->id]), $data)
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->putJson(route('api.v1.roomTypes.update', ['roomType'=>$roomType->id]), $data)
            ->assertForbidden();

        // Authorize user
        $role       = Role::factory()->create();
        $permission = Permission::firstOrCreate([ 'name' => 'roomTypes.update' ]);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test with authorized user, without updated at
        $this->actingAs($this->user)->putJson(route('api.v1.roomTypes.update', ['roomType'=>$roomType->id]), $data)
            ->assertStatus(CustomStatusCodes::STALE_MODEL->value);

        $data['updated_at'] = $roomType->updated_at;

        // Test with authorized user, with updated at
        $this->actingAs($this->user)->putJson(route('api.v1.roomTypes.update', ['roomType'=>$roomType->id]), $data)
            ->assertSuccessful()
            ->assertJsonFragment([
                'name'                    => $roomType->name,
                'color'                   => $roomType->color,
                'restrict'                => false,
                'roles'                   => [],
                'allow_listing'           => true,
                'require_access_code'     => false,
                'allow_record_attendance' => true,
                'max_duration'            => 90,
                'max_participants'        => 30
            ]);

        $roomType->refresh();
        $data['restrict']   = true;
        $data['updated_at'] = $roomType->updated_at;
        $this->actingAs($this->user)->putJson(route('api.v1.roomTypes.update', ['roomType'=>$roomType->id]), $data)
            ->assertSuccessful()
            ->assertJsonFragment([
                'name'          => $roomType->name,
                'color'         => $roomType->color,
                'allow_listing' => true,
                'restrict'      => true,
                'roles'         => new RoleCollection([$role1])
            ]);

        // Test with invalid data
        $roomType->refresh();
        $data = ['color'=>'rgb(255,255,255)','name'=>'','server_pool'=>'','updated_at'=>$roomType->updated_at,'allow_listing'=>'ok', 'require_access_code' => 'no', 'allow_record_attendance' => 'yes', 'max_duration' => -1, 'max_participants' => -1];
        $this->actingAs($this->user)->putJson(route('api.v1.roomTypes.update', ['roomType'=>$roomType->id]), $data)
            ->assertJsonValidationErrors(['color','name','allow_listing', 'max_duration', 'max_participants', 'require_access_code', 'allow_record_attendance']);

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
        $roomType = RoomType::factory()->create();

        // Test guests
        $this->deleteJson(route('api.v1.roomTypes.destroy', ['roomType'=>$roomType->id]))
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->deleteJson(route('api.v1.roomTypes.destroy', ['roomType'=>$roomType->id]))
            ->assertForbidden();

        // Authorize user
        $role       = Role::factory()->create();
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
        $room = Room::factory()->create();

        // Test delete for room type with room attached
        $this->actingAs($this->user)->deleteJson(route('api.v1.roomTypes.destroy', ['roomType'=>$room->roomType->id]))
            ->assertJsonValidationErrors(['replacement_room_type']);

        // Test with replacement own room
        $this->actingAs($this->user)->deleteJson(route('api.v1.roomTypes.destroy', ['roomType'=>$room->roomType->id]), ['replacement_room_type'=>$room->roomType->id])
            ->assertJsonValidationErrors(['replacement_room_type']);

        // Test with invalid replacement
        $this->actingAs($this->user)->deleteJson(route('api.v1.roomTypes.destroy', ['roomType'=>$room->roomType->id]), ['replacement_room_type'=>'0'])
            ->assertJsonValidationErrors(['replacement_room_type']);

        $newRoomType = RoomType::factory()->create();

        // Test with valid replacement
        $this->actingAs($this->user)->deleteJson(route('api.v1.roomTypes.destroy', ['roomType'=>$room->roomType->id]), ['replacement_room_type'=>$newRoomType->id])
            ->assertSuccessful();

        // Check if room was moved to new room type
        $room->refresh();
        $this->assertTrue($room->roomType->is($newRoomType));
    }
}
