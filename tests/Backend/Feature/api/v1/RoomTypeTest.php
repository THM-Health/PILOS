<?php

namespace Backend\Feature\api\v1;

use App\Enums\CustomStatusCodes;
use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Enums\RoomVisibility;
use App\Http\Resources\RoleCollection;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;

/**
 * General room types api feature tests
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
    public function test_index()
    {
        RoomType::query()->delete();
        $roomType = RoomType::factory()->create();
        $roomType1 = RoomType::factory()->create([
            'restrict' => true,
        ]);
        $roomType2 = RoomType::factory()->create([
            'restrict' => true,
        ]);
        $roomTypePublicEnforced = RoomType::factory()->create([
            'visibility_default' => RoomVisibility::PUBLIC,
            'visibility_enforced' => true,
        ]);

        $role1 = Role::factory()->create();
        $role2 = Role::factory()->create();

        $roomType1->roles()->sync([$role1->id]);
        $roomType2->roles()->sync([$role2->id]);

        $room = Room::factory()->create([
            'room_type_id' => $roomType1->id,
        ]);

        // Test guests
        $this->getJson(route('api.v1.roomTypes.index'))
            ->assertUnauthorized();

        // Test logged in users (without filter)
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.index'))
            ->assertSuccessful()
            ->assertJsonStructure(['data' => [
                '*' => [
                    'description',
                    'color',
                    'name',
                    'id',
                    'model_name',
                ],
            ]])
            ->assertJsonCount(4, 'data');

        // Test logged in users (without filter and without default room settings)
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.index', ['with_room_settings' => false]))
            ->assertSuccessful()
            ->assertJsonStructure(['data' => [
                '*' => [
                    'description',
                    'color',
                    'name',
                    'id',
                    'model_name',
                ],
            ]])
            ->assertJsonCount(4, 'data');

        // Test logged in users (without filter and with default room settings)
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.index', ['with_room_settings' => true]))
            ->assertSuccessful()
            ->assertJsonStructure(['data' => [
                '*' => [
                    'description',
                    'color',
                    'name',
                    'id',
                    'model_name',
                    'everyone_can_start_default',
                    'everyone_can_start_enforced',
                    'mute_on_start_default',
                    'mute_on_start_enforced',
                    'lock_settings_disable_cam_default',
                    'lock_settings_disable_cam_enforced',
                    'webcams_only_for_moderator_default',
                    'webcams_only_for_moderator_enforced',
                    'lock_settings_disable_mic_default',
                    'lock_settings_disable_mic_enforced',
                    'lock_settings_disable_private_chat_default',
                    'lock_settings_disable_private_chat_enforced',
                    'lock_settings_disable_public_chat_default',
                    'lock_settings_disable_public_chat_enforced',
                    'lock_settings_disable_note_default',
                    'lock_settings_disable_note_enforced',
                    'allow_membership_default',
                    'allow_membership_enforced',
                    'allow_guests_default',
                    'allow_guests_enforced',
                    'lock_settings_hide_user_list_default',
                    'lock_settings_hide_user_list_enforced',
                    'default_role_default',
                    'default_role_enforced',
                    'lobby_default',
                    'lobby_enforced',
                    'visibility_default',
                    'visibility_enforced',
                    'record_attendance_default',
                    'record_attendance_enforced',
                    'has_access_code_default',
                    'has_access_code_enforced',
                ],
            ]])
            ->assertJsonCount(4, 'data');

        // Test logged in users (with filter own)
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.index', ['filter' => 'own']))
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(
                ['id' => $roomType->id, 'name' => $roomType->name, 'color' => $roomType->color]
            )
            ->assertJsonFragment(
                ['id' => $roomTypePublicEnforced->id, 'name' => $roomTypePublicEnforced->name, 'color' => $roomTypePublicEnforced->color]
            );

        // Test logged in users (with different filter)
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.index', ['filter' => 1337]))
            ->assertForbidden();

        // Test logged in users (with room id as filter)
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.index', ['filter' => $room->id]))
            ->assertForbidden();

        $room->members()->attach($this->user, ['role' => RoomUserRole::CO_OWNER]);
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.index', ['filter' => $room->id]))
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(
                ['id' => $roomType->id, 'name' => $roomType->name, 'color' => $roomType->color]
            )
            ->assertJsonFragment(
                ['id' => $roomTypePublicEnforced->id, 'name' => $roomTypePublicEnforced->name, 'color' => $roomTypePublicEnforced->color]
            );

        // Test list of room types the owner of the given room has access to (Used when changing room type)
        $this->user->roles()->attach([$role1->id]);
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.index', ['filter' => $room->id]))
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(
                ['id' => $roomType->id, 'name' => $roomType->name, 'color' => $roomType->color]
            )
            ->assertJsonFragment(
                ['id' => $roomTypePublicEnforced->id, 'name' => $roomTypePublicEnforced->name, 'color' => $roomTypePublicEnforced->color]
            );

        $room->owner->roles()->attach([$role1->id, $role2->id]);
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.index', ['filter' => $room->id]))
            ->assertSuccessful()
            ->assertJsonCount(4, 'data');
    }

    /**
     * Test to view single room type
     */
    public function test_show()
    {
        $roomType = RoomType::factory()->create();

        // Test guests
        $this->getJson(route('api.v1.roomTypes.show', ['roomType' => $roomType->id]))
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.show', ['roomType' => $roomType->id]))
            ->assertForbidden();

        // Authorize user
        $role = Role::factory()->create();
        $permission = Permission::firstOrCreate(['name' => 'roomTypes.view']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test with authorized user
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.show', ['roomType' => $roomType->id]))
            ->assertSuccessful()
            ->assertJsonFragment(
                ['id' => $roomType->id, 'name' => $roomType->name, 'color' => $roomType->color]
            )
            ->assertJsonStructure(['data' => [
                'description',
                'color',
                'name',
                'id',
                'server_pool',
                'model_name',
                'restrict',
                'roles',
                'updated_at',
                'max_participants',
                'max_duration',
                'everyone_can_start_default',
                'everyone_can_start_enforced',
                'mute_on_start_default',
                'mute_on_start_enforced',
                'lock_settings_disable_cam_default',
                'lock_settings_disable_cam_enforced',
                'webcams_only_for_moderator_default',
                'webcams_only_for_moderator_enforced',
                'lock_settings_disable_mic_default',
                'lock_settings_disable_mic_enforced',
                'lock_settings_disable_private_chat_default',
                'lock_settings_disable_private_chat_enforced',
                'lock_settings_disable_public_chat_default',
                'lock_settings_disable_public_chat_enforced',
                'lock_settings_disable_note_default',
                'lock_settings_disable_note_enforced',
                'allow_membership_default',
                'allow_membership_enforced',
                'allow_guests_default',
                'allow_guests_enforced',
                'lock_settings_hide_user_list_default',
                'lock_settings_hide_user_list_enforced',
                'default_role_default',
                'default_role_enforced',
                'lobby_default',
                'lobby_enforced',
                'visibility_default',
                'visibility_enforced',
                'record_attendance_default',
                'record_attendance_enforced',
                'has_access_code_default',
                'has_access_code_enforced',
                'create_parameters',
            ]]);

        // Test deleted
        $roomType->delete();
        $this->actingAs($this->user)->getJson(route('api.v1.roomTypes.show', ['roomType' => $roomType->id]))
            ->assertNotFound();
    }

    /**
     * Test to create new room type
     */
    public function test_create()
    {
        $roomType = RoomType::factory()->make();
        $role1 = Role::factory()->create();

        $data = [
            'name' => $roomType->name,
            'color' => $roomType->color,
            'description' => $roomType->description,
            'server_pool' => $roomType->serverPool->id,
            'restrict' => true,
            'roles' => [$role1->id],
            'max_duration' => 90,
            'max_participants' => 30,
            'everyone_can_start_default' => false,
            'everyone_can_start_enforced' => false,
            'mute_on_start_default' => false,
            'mute_on_start_enforced' => false,
            'lock_settings_disable_cam_default' => false,
            'lock_settings_disable_cam_enforced' => false,
            'webcams_only_for_moderator_default' => false,
            'webcams_only_for_moderator_enforced' => false,
            'lock_settings_disable_mic_default' => false,
            'lock_settings_disable_mic_enforced' => false,
            'lock_settings_disable_private_chat_default' => false,
            'lock_settings_disable_private_chat_enforced' => false,
            'lock_settings_disable_public_chat_default' => false,
            'lock_settings_disable_public_chat_enforced' => false,
            'lock_settings_disable_note_default' => false,
            'lock_settings_disable_note_enforced' => false,
            'allow_membership_default' => false,
            'allow_membership_enforced' => false,
            'allow_guests_default' => false,
            'allow_guests_enforced' => false,
            'lock_settings_hide_user_list_default' => false,
            'lock_settings_hide_user_list_enforced' => false,
            'default_role_default' => RoomUserRole::USER,
            'default_role_enforced' => false,
            'lobby_default' => RoomLobby::DISABLED,
            'lobby_enforced' => false,
            'visibility_default' => RoomVisibility::PRIVATE,
            'visibility_enforced' => false,
            'record_attendance_default' => false,
            'record_attendance_enforced' => false,
            'record_default' => false,
            'record_enforced' => false,
            'auto_start_recording_default' => false,
            'auto_start_recording_enforced' => false,
            'has_access_code_default' => true,
            'has_access_code_enforced' => false,
            'create_parameters' => 'meetingLayout=PRESENTATION_FOCUS',
        ];

        // Test guests
        $this->postJson(route('api.v1.roomTypes.store'), $data)
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->postJson(route('api.v1.roomTypes.store'), $data)
            ->assertForbidden();

        // Authorize user
        $role = Role::factory()->create();
        $permission = Permission::firstOrCreate(['name' => 'roomTypes.create']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test with authorized user
        $this->actingAs($this->user)->postJson(route('api.v1.roomTypes.store'), $data)
            ->assertSuccessful()
            ->assertJsonFragment([
                'name' => $roomType->name,
                'color' => $roomType->color,
                'description' => $roomType->description,
                'restrict' => true,
                'roles' => new RoleCollection([$role1]),
                'max_duration' => 90,
                'max_participants' => 30,
                'everyone_can_start_default' => false,
                'everyone_can_start_enforced' => false,
                'mute_on_start_default' => false,
                'mute_on_start_enforced' => false,
                'lock_settings_disable_cam_default' => false,
                'lock_settings_disable_cam_enforced' => false,
                'webcams_only_for_moderator_default' => false,
                'webcams_only_for_moderator_enforced' => false,
                'lock_settings_disable_mic_default' => false,
                'lock_settings_disable_mic_enforced' => false,
                'lock_settings_disable_private_chat_default' => false,
                'lock_settings_disable_private_chat_enforced' => false,
                'lock_settings_disable_public_chat_default' => false,
                'lock_settings_disable_public_chat_enforced' => false,
                'lock_settings_disable_note_default' => false,
                'lock_settings_disable_note_enforced' => false,
                'allow_membership_default' => false,
                'allow_membership_enforced' => false,
                'allow_guests_default' => false,
                'allow_guests_enforced' => false,
                'lock_settings_hide_user_list_default' => false,
                'lock_settings_hide_user_list_enforced' => false,
                'default_role_default' => RoomUserRole::USER,
                'default_role_enforced' => false,
                'lobby_default' => RoomLobby::DISABLED,
                'lobby_enforced' => false,
                'visibility_default' => RoomVisibility::PRIVATE,
                'visibility_enforced' => false,
                'record_attendance_default' => false,
                'record_attendance_enforced' => false,
                'record_default' => false,
                'record_enforced' => false,
                'auto_start_recording_default' => false,
                'auto_start_recording_enforced' => false,
                'has_access_code_default' => true,
                'has_access_code_enforced' => false,
                'create_parameters' => 'meetingLayout=PRESENTATION_FOCUS',
            ]);

        // Test with invalid data
        $data = [
            'color' => 'rgb(255,255,255)',
            'name' => '',
            'description' => $this->faker->textWithLength(5001),
            'server_pool' => '',
            'restrict' => true,
            'max_duration' => -1,
            'max_participants' => -1,
            'everyone_can_start_default' => 'ok',
            'everyone_can_start_enforced' => 'no',
            'mute_on_start_default' => 'yes',
            'mute_on_start_enforced' => 'no',
            'lock_settings_disable_cam_default' => 'no',
            'lock_settings_disable_cam_enforced' => 'no',
            'webcams_only_for_moderator_default' => 'no',
            'webcams_only_for_moderator_enforced' => 'no',
            'lock_settings_disable_mic_default' => 'no',
            'lock_settings_disable_mic_enforced' => 'no',
            'lock_settings_disable_private_chat_default' => 'no',
            'lock_settings_disable_private_chat_enforced' => 'no',
            'lock_settings_disable_public_chat_default' => 'no',
            'lock_settings_disable_public_chat_enforced' => 'no',
            'lock_settings_disable_note_default' => 'no',
            'lock_settings_disable_note_enforced' => 'no',
            'allow_membership_default' => 'no',
            'allow_membership_enforced' => 'no',
            'allow_guests_default' => 'no',
            'allow_guests_enforced' => 'no',
            'lock_settings_hide_user_list_default' => 'no',
            'lock_settings_hide_user_list_enforced' => 'no',
            'default_role_default' => 'no',
            'default_role_enforced' => 'no',
            'lobby_default' => 'no',
            'lobby_enforced' => 'no',
            'visibility_default' => 10,
            'visibility_enforced' => 'no',
            'record_attendance_default' => 'no',
            'record_attendance_enforced' => 'no',
            'record_default' => 'no',
            'record_enforced' => 'no',
            'auto_start_recording_default' => 'no',
            'auto_start_recording_enforced' => 'no',
            'has_access_code_default' => 'yes',
            'has_access_code_enforced' => 'no',
            'create_parameters' => $this->faker->textWithLength(65001),
        ];
        $this->actingAs($this->user)->postJson(route('api.v1.roomTypes.store'), $data)
            ->assertJsonValidationErrors([
                'description',
                'color',
                'name',
                'roles',
                'server_pool',
                'max_participants',
                'max_duration',
                'everyone_can_start_default',
                'everyone_can_start_enforced',
                'mute_on_start_default',
                'mute_on_start_enforced',
                'lock_settings_disable_cam_default',
                'lock_settings_disable_cam_enforced',
                'webcams_only_for_moderator_default',
                'webcams_only_for_moderator_enforced',
                'lock_settings_disable_mic_default',
                'lock_settings_disable_mic_enforced',
                'lock_settings_disable_private_chat_default',
                'lock_settings_disable_private_chat_enforced',
                'lock_settings_disable_public_chat_default',
                'lock_settings_disable_public_chat_enforced',
                'lock_settings_disable_note_default',
                'lock_settings_disable_note_enforced',
                'allow_membership_default',
                'allow_membership_enforced',
                'allow_guests_default',
                'allow_guests_enforced',
                'lock_settings_hide_user_list_default',
                'lock_settings_hide_user_list_enforced',
                'default_role_default',
                'default_role_enforced',
                'lobby_default',
                'lobby_enforced',
                'visibility_default',
                'visibility_enforced',
                'record_attendance_default',
                'record_attendance_enforced',
                'record_default',
                'record_enforced',
                'auto_start_recording_default',
                'auto_start_recording_enforced',
                'has_access_code_default',
                'has_access_code_enforced',
                'create_parameters',
            ]);

        $data['roles'] = [1337];
        $this->actingAs($this->user)->postJson(route('api.v1.roomTypes.store'), $data)
            ->assertJsonValidationErrors([
                'color',
                'name',
                'roles.0',
            ]);

        // Test with missing parameters
        $data = [];
        $this->actingAs($this->user)->postJson(route('api.v1.roomTypes.store'), $data)
            ->assertJsonValidationErrors([
                'color',
                'server_pool',
                'restrict',
                'max_participants',
                'max_duration',
                'everyone_can_start_default',
                'everyone_can_start_enforced',
                'mute_on_start_default',
                'mute_on_start_enforced',
                'lock_settings_disable_cam_default',
                'lock_settings_disable_cam_enforced',
                'webcams_only_for_moderator_default',
                'webcams_only_for_moderator_enforced',
                'lock_settings_disable_mic_default',
                'lock_settings_disable_mic_enforced',
                'lock_settings_disable_private_chat_default',
                'lock_settings_disable_private_chat_enforced',
                'lock_settings_disable_public_chat_default',
                'lock_settings_disable_public_chat_enforced',
                'lock_settings_disable_note_default',
                'lock_settings_disable_note_enforced',
                'allow_membership_default',
                'allow_membership_enforced',
                'allow_guests_default',
                'allow_guests_enforced',
                'lock_settings_hide_user_list_default',
                'lock_settings_hide_user_list_enforced',
                'default_role_default',
                'default_role_enforced',
                'lobby_default',
                'lobby_enforced',
                'visibility_default',
                'visibility_enforced',
                'record_attendance_default',
                'record_attendance_enforced',
                'record_default',
                'record_enforced',
                'auto_start_recording_default',
                'auto_start_recording_enforced',
                'has_access_code_default',
                'has_access_code_enforced',
            ]);
    }

    /**
     * Test to update a room type
     */
    public function test_update()
    {
        $roomType = RoomType::factory()->create();
        $role1 = Role::factory()->create();

        $data = [
            'name' => $roomType->name,
            'color' => $roomType->color,
            'description' => $roomType->description,
            'server_pool' => $roomType->serverPool->id,
            'restrict' => false,
            'roles' => [$role1->id],
            'max_duration' => 90,
            'max_participants' => 30,
            'everyone_can_start_default' => false,
            'everyone_can_start_enforced' => false,
            'mute_on_start_default' => false,
            'mute_on_start_enforced' => false,
            'lock_settings_disable_cam_default' => false,
            'lock_settings_disable_cam_enforced' => false,
            'webcams_only_for_moderator_default' => false,
            'webcams_only_for_moderator_enforced' => false,
            'lock_settings_disable_mic_default' => false,
            'lock_settings_disable_mic_enforced' => false,
            'lock_settings_disable_private_chat_default' => false,
            'lock_settings_disable_private_chat_enforced' => false,
            'lock_settings_disable_public_chat_default' => false,
            'lock_settings_disable_public_chat_enforced' => false,
            'lock_settings_disable_note_default' => false,
            'lock_settings_disable_note_enforced' => false,
            'allow_membership_default' => false,
            'allow_membership_enforced' => false,
            'allow_guests_default' => false,
            'allow_guests_enforced' => false,
            'lock_settings_hide_user_list_default' => false,
            'lock_settings_hide_user_list_enforced' => false,
            'default_role_default' => RoomUserRole::USER,
            'default_role_enforced' => false,
            'lobby_default' => RoomLobby::DISABLED,
            'lobby_enforced' => false,
            'visibility_default' => RoomVisibility::PUBLIC,
            'visibility_enforced' => false,
            'record_attendance_default' => false,
            'record_attendance_enforced' => false,
            'record_default' => false,
            'record_enforced' => false,
            'auto_start_recording_default' => false,
            'auto_start_recording_enforced' => false,
            'has_access_code_default' => true,
            'has_access_code_enforced' => false,
            'create_parameters' => 'meetingLayout=PRESENTATION_FOCUS',
        ];

        // Test guests
        $this->putJson(route('api.v1.roomTypes.update', ['roomType' => $roomType->id]), $data)
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->putJson(route('api.v1.roomTypes.update', ['roomType' => $roomType->id]), $data)
            ->assertForbidden();

        // Authorize user
        $role = Role::factory()->create();
        $permission = Permission::firstOrCreate(['name' => 'roomTypes.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test with authorized user, without updated at
        $this->actingAs($this->user)->putJson(route('api.v1.roomTypes.update', ['roomType' => $roomType->id]), $data)
            ->assertStatus(CustomStatusCodes::STALE_MODEL->value);

        $data['updated_at'] = $roomType->updated_at;

        // Test with authorized user, with updated at
        $this->actingAs($this->user)->putJson(route('api.v1.roomTypes.update', ['roomType' => $roomType->id]), $data)
            ->assertSuccessful()
            ->assertJsonFragment([
                'name' => $roomType->name,
                'color' => $roomType->color,
                'description' => $roomType->description,
                'restrict' => false,
                'roles' => [],
                'max_duration' => 90,
                'max_participants' => 30,
                'everyone_can_start_default' => false,
                'everyone_can_start_enforced' => false,
                'mute_on_start_default' => false,
                'mute_on_start_enforced' => false,
                'lock_settings_disable_cam_default' => false,
                'lock_settings_disable_cam_enforced' => false,
                'webcams_only_for_moderator_default' => false,
                'webcams_only_for_moderator_enforced' => false,
                'lock_settings_disable_mic_default' => false,
                'lock_settings_disable_mic_enforced' => false,
                'lock_settings_disable_private_chat_default' => false,
                'lock_settings_disable_private_chat_enforced' => false,
                'lock_settings_disable_public_chat_default' => false,
                'lock_settings_disable_public_chat_enforced' => false,
                'lock_settings_disable_note_default' => false,
                'lock_settings_disable_note_enforced' => false,
                'allow_membership_default' => false,
                'allow_membership_enforced' => false,
                'allow_guests_default' => false,
                'allow_guests_enforced' => false,
                'lock_settings_hide_user_list_default' => false,
                'lock_settings_hide_user_list_enforced' => false,
                'default_role_default' => RoomUserRole::USER,
                'default_role_enforced' => false,
                'lobby_default' => RoomLobby::DISABLED,
                'lobby_enforced' => false,
                'visibility_default' => RoomVisibility::PUBLIC,
                'visibility_enforced' => false,
                'record_attendance_default' => false,
                'record_attendance_enforced' => false,
                'record_default' => false,
                'record_enforced' => false,
                'auto_start_recording_default' => false,
                'auto_start_recording_enforced' => false,
                'has_access_code_default' => true,
                'has_access_code_enforced' => false,
                'create_parameters' => 'meetingLayout=PRESENTATION_FOCUS',
            ]);

        $roomType->refresh();
        $data['restrict'] = true;
        $data['updated_at'] = $roomType->updated_at;
        $this->actingAs($this->user)->putJson(route('api.v1.roomTypes.update', ['roomType' => $roomType->id]), $data)
            ->assertSuccessful()
            ->assertJsonFragment([
                'name' => $roomType->name,
                'color' => $roomType->color,
                'restrict' => true,
                'roles' => new RoleCollection([$role1]),
            ]);

        // Test with invalid data
        $roomType->refresh();
        $data = [
            'color' => 'rgb(255,255,255)',
            'name' => '',
            'description' => fake()->text(6000),
            'server_pool' => '',
            'restrict' => true,
            'max_duration' => -1,
            'max_participants' => -1,
            'everyone_can_start_default' => 'ok',
            'everyone_can_start_enforced' => 'no',
            'mute_on_start_default' => 'yes',
            'mute_on_start_enforced' => 'no',
            'lock_settings_disable_cam_default' => 'no',
            'lock_settings_disable_cam_enforced' => 'no',
            'webcams_only_for_moderator_default' => 'no',
            'webcams_only_for_moderator_enforced' => 'no',
            'lock_settings_disable_mic_default' => 'no',
            'lock_settings_disable_mic_enforced' => 'no',
            'lock_settings_disable_private_chat_default' => 'no',
            'lock_settings_disable_private_chat_enforced' => 'no',
            'lock_settings_disable_public_chat_default' => 'no',
            'lock_settings_disable_public_chat_enforced' => 'no',
            'lock_settings_disable_note_default' => 'no',
            'lock_settings_disable_note_enforced' => 'no',
            'allow_membership_default' => 'no',
            'allow_membership_enforced' => 'no',
            'allow_guests_default' => 'no',
            'allow_guests_enforced' => 'no',
            'lock_settings_hide_user_list_default' => 'no',
            'lock_settings_hide_user_list_enforced' => 'no',
            'default_role_default' => 'no',
            'default_role_enforced' => 'no',
            'lobby_default' => 'no',
            'lobby_enforced' => 'no',
            'visibility_default' => 'no',
            'visibility_enforced' => 'no',
            'record_attendance_default' => 'no',
            'record_attendance_enforced' => 'no',
            'record_default' => 'no',
            'record_enforced' => 'no',
            'auto_start_recording_default' => 'no',
            'auto_start_recording_enforced' => 'no',
            'has_access_code_default' => 'yes',
            'has_access_code_enforced' => 'no',
            'create_parameters' => "meta_foo=baa\nrecord=invalid\nmaxParticipants=10.5\nmeetingLayout=invalid\ndisabledFeatures=learningDashboard,invalid",
            'updated_at' => $roomType->updated_at,
        ];
        $this->actingAs($this->user)->putJson(route('api.v1.roomTypes.update', ['roomType' => $roomType->id]), $data)
            ->assertJsonValidationErrors([
                'description',
                'color',
                'name',
                'roles',
                'server_pool',
                'max_participants',
                'max_duration',
                'everyone_can_start_default',
                'everyone_can_start_enforced',
                'mute_on_start_default',
                'mute_on_start_enforced',
                'lock_settings_disable_cam_default',
                'lock_settings_disable_cam_enforced',
                'webcams_only_for_moderator_default',
                'webcams_only_for_moderator_enforced',
                'lock_settings_disable_mic_default',
                'lock_settings_disable_mic_enforced',
                'lock_settings_disable_private_chat_default',
                'lock_settings_disable_private_chat_enforced',
                'lock_settings_disable_public_chat_default',
                'lock_settings_disable_public_chat_enforced',
                'lock_settings_disable_note_default',
                'lock_settings_disable_note_enforced',
                'allow_membership_default',
                'allow_membership_enforced',
                'allow_guests_default',
                'allow_guests_enforced',
                'lock_settings_hide_user_list_default',
                'lock_settings_hide_user_list_enforced',
                'default_role_default',
                'default_role_enforced',
                'lobby_default',
                'lobby_enforced',
                'visibility_default',
                'visibility_enforced',
                'record_attendance_default',
                'record_attendance_enforced',
                'record_default',
                'record_enforced',
                'auto_start_recording_default',
                'auto_start_recording_enforced',
                'has_access_code_default',
                'has_access_code_enforced',
                'create_parameters',
            ]);

        // Test with missing parameters
        $data = [
            'updated_at' => $roomType->updated_at,
        ];

        $this->actingAs($this->user)->putJson(route('api.v1.roomTypes.update', ['roomType' => $roomType->id]), $data)
            ->assertJsonValidationErrors([
                'color',
                'server_pool',
                'restrict',
                'max_participants',
                'max_duration',
                'everyone_can_start_default',
                'everyone_can_start_enforced',
                'mute_on_start_default',
                'mute_on_start_enforced',
                'lock_settings_disable_cam_default',
                'lock_settings_disable_cam_enforced',
                'webcams_only_for_moderator_default',
                'webcams_only_for_moderator_enforced',
                'lock_settings_disable_mic_default',
                'lock_settings_disable_mic_enforced',
                'lock_settings_disable_private_chat_default',
                'lock_settings_disable_private_chat_enforced',
                'lock_settings_disable_public_chat_default',
                'lock_settings_disable_public_chat_enforced',
                'lock_settings_disable_note_default',
                'lock_settings_disable_note_enforced',
                'allow_membership_default',
                'allow_membership_enforced',
                'allow_guests_default',
                'allow_guests_enforced',
                'lock_settings_hide_user_list_default',
                'lock_settings_hide_user_list_enforced',
                'default_role_default',
                'default_role_enforced',
                'lobby_default',
                'lobby_enforced',
                'visibility_default',
                'visibility_enforced',
                'record_attendance_default',
                'record_attendance_enforced',
                'record_default',
                'record_enforced',
                'auto_start_recording_default',
                'auto_start_recording_enforced',
                'has_access_code_default',
                'has_access_code_enforced',
            ]);

        // Test deleted
        $roomType->delete();
        $this->actingAs($this->user)->putJson(route('api.v1.roomTypes.update', ['roomType' => $roomType->id]), $data)
            ->assertNotFound();
    }

    /**
     * Test to delete a room type
     */
    public function test_delete()
    {
        $roomType = RoomType::factory()->create();

        // Test guests
        $this->deleteJson(route('api.v1.roomTypes.destroy', ['roomType' => $roomType->id]))
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->deleteJson(route('api.v1.roomTypes.destroy', ['roomType' => $roomType->id]))
            ->assertForbidden();

        // Authorize user
        $role = Role::factory()->create();
        $permission = Permission::firstOrCreate(['name' => 'roomTypes.delete']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test delete for room type without rooms attached
        $this->actingAs($this->user)->deleteJson(route('api.v1.roomTypes.destroy', ['roomType' => $roomType->id]))
            ->assertSuccessful();

        // Test delete again
        $this->actingAs($this->user)->deleteJson(route('api.v1.roomTypes.destroy', ['roomType' => $roomType->id]))
            ->assertNotFound();

        $this->assertDatabaseMissing('room_types', ['id' => $roomType->id]);

        // Create new rooms
        $room = Room::factory()->create();

        // Test delete for room type with room attached
        $this->actingAs($this->user)->deleteJson(route('api.v1.roomTypes.destroy', ['roomType' => $room->roomType->id]))
            ->assertJsonValidationErrors(['replacement_room_type']);

        // Test with replacement own room
        $this->actingAs($this->user)->deleteJson(route('api.v1.roomTypes.destroy', ['roomType' => $room->roomType->id]), ['replacement_room_type' => $room->roomType->id])
            ->assertJsonValidationErrors(['replacement_room_type']);

        // Test with invalid replacement
        $this->actingAs($this->user)->deleteJson(route('api.v1.roomTypes.destroy', ['roomType' => $room->roomType->id]), ['replacement_room_type' => '0'])
            ->assertJsonValidationErrors(['replacement_room_type']);

        $newRoomType = RoomType::factory()->create();

        // Test with valid replacement
        $this->actingAs($this->user)->deleteJson(route('api.v1.roomTypes.destroy', ['roomType' => $room->roomType->id]), ['replacement_room_type' => $newRoomType->id])
            ->assertSuccessful();

        // Check if room was moved to new room type
        $room->refresh();
        $this->assertTrue($room->roomType->is($newRoomType));
    }
}
