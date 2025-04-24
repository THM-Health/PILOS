<?php

namespace Tests\Backend\Feature\api\v1;

use App\Models\Permission;
use App\Models\Role;
use App\Models\RoomType;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Tests\Backend\TestCase;

class StreamingTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
        config(['streaming.enabled' => true]);
        $this->user = User::factory()->create();
        $this->role = Role::factory()->create();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->updatePermission = Permission::where('name', 'streaming.update')->first();
        $this->viewAnyPermission = Permission::where('name', 'streaming.viewAny')->first();

        $this->file_valid = UploadedFile::fake()->image('image.jpg', 1920, 1080);
        $this->file_wrong_mime = UploadedFile::fake()->image('image.svg', 1920, 1080);
        $this->file_wrong_dimensions = UploadedFile::fake()->image('image.jpg', 1080, 1920);
        $this->file_too_big = UploadedFile::fake()->create('image.jpg', 5001, 'image/jpeg');
    }

    /**
     * Test global streaming settings can be viewed by admins with permissions
     */
    public function test_view_settings()
    {
        // Test as guest
        $this->getJson(route('api.v1.streaming.view'))
            ->assertUnauthorized();

        // Test as user
        $this->actingAs($this->user)
            ->getJson(route('api.v1.streaming.view'))
            ->assertForbidden();

        $this->user->roles()->attach($this->role);

        // Test as admin with permissions to view settings
        $this->role->permissions()->attach($this->viewAnyPermission);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.streaming.view'))
            ->assertSuccessful();
        $this->role->permissions()->detach($this->viewAnyPermission);

        // Test as admin with permissions to update settings
        $this->role->permissions()->attach($this->updatePermission);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.streaming.view'))
            ->assertSuccessful();

        // Test if global settings and all room types are returned
        $this->actingAs($this->user)
            ->getJson(route('api.v1.streaming.view'))
            ->assertJson([
                'data' => [
                    'default_pause_image' => null,
                    'room_types' => [
                        [
                            'id' => 1,
                            'name' => 'Lecture',
                            'streaming_settings' => [
                                'enabled' => false,
                                'default_pause_image' => null,
                            ],
                        ],
                        [
                            'id' => 2,
                            'name' => 'Meeting',
                            'streaming_settings' => [
                                'enabled' => false,
                                'default_pause_image' => null,
                            ],
                        ],
                        [
                            'id' => 3,
                            'name' => 'Exam',
                            'streaming_settings' => [
                                'enabled' => false,
                                'default_pause_image' => null,
                            ],
                        ],
                        [
                            'id' => 4,
                            'name' => 'Seminar',
                            'streaming_settings' => [
                                'enabled' => false,
                                'default_pause_image' => null,
                            ],
                        ],
                    ],
                ],
            ]);

        // Adjust global settings and room type settings
        $this->streamingSettings->default_pause_image = 'https://example.com/system_pause_image.png';
        $this->streamingSettings->css_file = 'https://example.com/streaming.css';
        $this->streamingSettings->join_parameters = "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_show_participants_on_login=false\nuserdata-bbb_show_public_chat_on_login=false";
        $this->streamingSettings->save();

        $lecture = RoomType::where('name', 'Lecture')->first();
        $lecture->streamingSettings->enabled = true;
        $lecture->streamingSettings->default_pause_image = 'https://example.com/lecture_pause_image.png';
        $lecture->streamingSettings->save();

        $meeting = RoomType::where('name', 'Meeting')->first();
        $meeting->streamingSettings->enabled = true;
        $meeting->streamingSettings->default_pause_image = null;
        $meeting->streamingSettings->save();

        $exam = RoomType::where('name', 'Exam')->first();
        $exam->streamingSettings->enabled = false;
        $exam->streamingSettings->default_pause_image = 'https://example.com/exam_pause_image.png';
        $exam->streamingSettings->save();

        $seminar = RoomType::where('name', 'Seminar')->first();
        $seminar->streamingSettings->enabled = false;
        $seminar->streamingSettings->default_pause_image = null;
        $seminar->streamingSettings->save();

        // Test if global settings and all room types are returned
        $this->actingAs($this->user)
            ->getJson(route('api.v1.streaming.view'))
            ->assertJson([
                'data' => [
                    'default_pause_image' => 'https://example.com/system_pause_image.png',
                    'css_file' => 'https://example.com/streaming.css',
                    'join_parameters' => "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_show_participants_on_login=false\nuserdata-bbb_show_public_chat_on_login=false",
                    'room_types' => [
                        [
                            'id' => 1,
                            'name' => 'Lecture',
                            'streaming_settings' => [
                                'enabled' => true,
                                'default_pause_image' => 'https://example.com/lecture_pause_image.png',
                            ],
                        ],
                        [
                            'id' => 2,
                            'name' => 'Meeting',
                            'streaming_settings' => [
                                'enabled' => true,
                                'default_pause_image' => null,
                            ],
                        ],
                        [
                            'id' => 3,
                            'name' => 'Exam',
                            'streaming_settings' => [
                                'enabled' => false,
                                'default_pause_image' => 'https://example.com/exam_pause_image.png',
                            ],
                        ],
                        [
                            'id' => 4,
                            'name' => 'Seminar',
                            'streaming_settings' => [
                                'enabled' => false,
                                'default_pause_image' => null,
                            ],
                        ],
                    ],
                ],
            ]);

        // Disable streaming globally, route should be disabled
        config(['streaming.enabled' => false]);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.streaming.view'))
            ->assertNotFound();
    }

    /**
     * Test global streaming settings can be updated by admins with permissions
     */
    public function test_update_global_settings()
    {
        $data = [
            'default_pause_image' => null,
            'css_file' => null,
            'join_parameters' => null,
        ];

        // Test as guest
        $this->putJson(route('api.v1.streaming.update'), $data)
            ->assertUnauthorized();

        // Test as user
        $this->actingAs($this->user)
            ->putJson(route('api.v1.streaming.update'), $data)
            ->assertForbidden();

        $this->user->roles()->attach($this->role);

        // Test as admin with permissions to view settings
        $this->role->permissions()->attach($this->viewAnyPermission);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.streaming.update'), $data)
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAnyPermission);

        // Test as admin with permissions to update settings
        $this->role->permissions()->attach($this->updatePermission);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.streaming.update'), $data)
            ->assertSuccessful();

        // Test with wrong mime type
        $this->actingAs($this->user)
            ->putJson(route('api.v1.streaming.update'), [
                'default_pause_image' => $this->file_wrong_mime,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['default_pause_image']);

        // Test with wrong dimensions
        $this->actingAs($this->user)
            ->putJson(route('api.v1.streaming.update'), [
                'default_pause_image' => $this->file_wrong_dimensions,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['default_pause_image']);

        // Test with too big file
        $this->actingAs($this->user)
            ->putJson(route('api.v1.streaming.update'), [
                'default_pause_image' => $this->file_too_big,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['default_pause_image']);

        // Test with valid file
        $result = $this->actingAs($this->user)
            ->putJson(route('api.v1.streaming.update'), [
                'default_pause_image' => $this->file_valid,
            ])
            ->assertSuccessful();
        $this->assertNotNull($result->json('data.default_pause_image'));
        $this->streamingSettings->refresh();
        $this->assertStringStartsWith(url('/storage/images/'), $this->streamingSettings->default_pause_image);

        // Validate if the file is not deleted if request is empty
        $this->actingAs($this->user)
            ->putJson(route('api.v1.streaming.update'), [])
            ->assertSuccessful();
        $this->streamingSettings->refresh();
        $this->assertNotNull($this->streamingSettings->default_pause_image);

        // Validate if the file is deleted if default_pause_image is null
        $result = $this->actingAs($this->user)
            ->putJson(route('api.v1.streaming.update'), [
                'default_pause_image' => null,
            ])
            ->assertSuccessful();
        $this->assertNull($result->json('data.default_pause_image'));
        $this->streamingSettings->refresh();
        $this->assertNull($this->streamingSettings->default_pause_image);

        // Upload css file
        $data['css_file'] = UploadedFile::fake()->create('streaming.css', 100, 'text/css');
        $this->actingAs($this->user)
            ->putJson(route('api.v1.streaming.update'), $data)
            ->assertSuccessful();
        $this->streamingSettings->refresh();
        $this->assertEquals('http://localhost/storage/styles/streaming.css', $this->streamingSettings->css_file);

        // Upload css file with wrong mime type
        $data['css_file'] = UploadedFile::fake()->create('streaming.txt', 100, 'text/plain');
        $this->actingAs($this->user)
            ->putJson(route('api.v1.streaming.update'), $data)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['css_file']);

        // Upload css file with too big size
        $data['css_file'] = UploadedFile::fake()->create('streaming.css', 5001, 'text/css');
        $this->actingAs($this->user)
            ->putJson(route('api.v1.streaming.update'), $data)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['css_file']);

        // Validate if the css file is not deleted if request is empty
        unset($data['css_file']);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.streaming.update'), $data)
            ->assertSuccessful();
        $this->streamingSettings->refresh();
        $this->assertNotNull($this->streamingSettings->css_file);

        // Validate if the css file is deleted if css_file is null
        $data['css_file'] = null;
        $result = $this->actingAs($this->user)
            ->putJson(route('api.v1.streaming.update'), $data)
            ->assertSuccessful();
        $this->assertNull($result->json('data.css_file'));
        $this->streamingSettings->refresh();
        $this->assertNull($this->streamingSettings->css_file);

        // Add valid join parameters
        $data['join_parameters'] = "enforceLayout=PRESENTATION_FOCUS\nuserdata-bbb_hide_nav_bar=true\nuserdata-bbb_show_participants_on_login=false\nuserdata-bbb_show_public_chat_on_login=false";
        $this->actingAs($this->user)
            ->putJson(route('api.v1.streaming.update'), $data)
            ->assertSuccessful();
        $this->streamingSettings->refresh();
        $this->assertEquals("enforceLayout=PRESENTATION_FOCUS\nuserdata-bbb_hide_nav_bar=true\nuserdata-bbb_show_participants_on_login=false\nuserdata-bbb_show_public_chat_on_login=false", $this->streamingSettings->join_parameters);

        // Add invalid join parameters
        $data['join_parameters'] = "meta_foo=baa\nrecord=invalid\nmaxParticipants=10.5\nenforceLayout=invalid";
        $this->actingAs($this->user)
            ->putJson(route('api.v1.streaming.update'), $data)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['join_parameters']);

        // Disable streaming globally, route should be disabled
        config(['streaming.enabled' => false]);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.streaming.update'), [
                'default_pause_image' => null,
            ])
            ->assertNotFound();
    }

    /**
     * Test room type streaming settings can be viewed by admins with permissions
     */
    public function test_view_room_type_settings()
    {
        $lecture = RoomType::where('name', 'Lecture')->first();

        // Test as guest
        $this->getJson(route('api.v1.roomTypes.streaming.view', ['roomType' => $lecture]))
            ->assertUnauthorized();

        // Test as user
        $this->actingAs($this->user)
            ->getJson(route('api.v1.roomTypes.streaming.view', ['roomType' => $lecture]))
            ->assertForbidden();

        $this->user->roles()->attach($this->role);

        // Test as admin with permissions to view settings
        $this->role->permissions()->attach($this->viewAnyPermission);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.roomTypes.streaming.view', ['roomType' => $lecture]))
            ->assertSuccessful();
        $this->role->permissions()->detach($this->viewAnyPermission);

        // Test as admin with permissions to update settings
        $this->role->permissions()->attach($this->updatePermission);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.roomTypes.streaming.view', ['roomType' => $lecture]))
            ->assertSuccessful();

        // Test if room type settings are returned
        $this->actingAs($this->user)
            ->getJson(route('api.v1.roomTypes.streaming.view', ['roomType' => $lecture]))
            ->assertJson([
                'data' => [
                    'enabled' => false,
                    'default_pause_image' => null,
                ],
            ]);

        // Adjust settings
        $lecture->streamingSettings->enabled = true;
        $lecture->streamingSettings->default_pause_image = 'https://example.com/lecture_pause_image.png';
        $lecture->streamingSettings->save();

        // Test if settings are returned
        $this->actingAs($this->user)
            ->getJson(route('api.v1.roomTypes.streaming.view', ['roomType' => $lecture]))
            ->assertJson([
                'data' => [
                    'enabled' => true,
                    'default_pause_image' => 'https://example.com/lecture_pause_image.png',
                ],
            ]);

        // Disable streaming globally, route should be disabled
        config(['streaming.enabled' => false]);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.roomTypes.streaming.view', ['roomType' => $lecture]))
            ->assertNotFound();
    }

    /**
     * Test room type streaming settings can be updated by admins with permissions
     */
    public function test_update_room_type_settings()
    {
        $lecture = RoomType::where('name', 'Lecture')->first();

        $data = [
            'enabled' => true,
            'default_pause_image' => null,
        ];

        // Test as guest
        $this->putJson(route('api.v1.roomTypes.streaming.update', ['roomType' => $lecture]), $data)
            ->assertUnauthorized();

        // Test as user
        $this->actingAs($this->user)
            ->putJson(route('api.v1.roomTypes.streaming.update', ['roomType' => $lecture]), $data)
            ->assertForbidden();

        $this->user->roles()->attach($this->role);

        // Test as admin with permissions to view settings
        $this->role->permissions()->attach($this->viewAnyPermission);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.roomTypes.streaming.update', ['roomType' => $lecture]), $data)
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAnyPermission);

        // Test as admin with permissions to update settings
        $this->role->permissions()->attach($this->updatePermission);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.roomTypes.streaming.update', ['roomType' => $lecture]), $data)
            ->assertSuccessful();

        // Missing enabled parameter
        unset($data['enabled']);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.roomTypes.streaming.update', ['roomType' => $lecture]), $data)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['enabled']);

        // Enable streaming wrong parameter type
        $data['enabled'] = 'wrong';
        $this->actingAs($this->user)
            ->putJson(route('api.v1.roomTypes.streaming.update', ['roomType' => $lecture]), $data)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['enabled']);

        // Disable streaming
        $data['enabled'] = false;
        $this->actingAs($this->user)
            ->putJson(route('api.v1.roomTypes.streaming.update', ['roomType' => $lecture]), $data)
            ->assertSuccessful()
            ->assertJsonPath('data.enabled', false);
        $lecture->streamingSettings->refresh();
        $this->assertFalse($lecture->streamingSettings->enabled);

        // Enable streaming
        $data['enabled'] = true;
        $this->actingAs($this->user)
            ->putJson(route('api.v1.roomTypes.streaming.update', ['roomType' => $lecture]), $data)
            ->assertSuccessful()
            ->assertJsonPath('data.enabled', true);
        $lecture->streamingSettings->refresh();

        // Test with wrong mime type
        $data['default_pause_image'] = $this->file_wrong_mime;
        $this->actingAs($this->user)
            ->putJson(route('api.v1.roomTypes.streaming.update', ['roomType' => $lecture]), $data)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['default_pause_image']);

        // Test with wrong dimensions
        $data['default_pause_image'] = $this->file_wrong_dimensions;
        $this->actingAs($this->user)
            ->putJson(route('api.v1.roomTypes.streaming.update', ['roomType' => $lecture]), $data)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['default_pause_image']);

        // Test with too big file
        $data['default_pause_image'] = $this->file_too_big;
        $this->actingAs($this->user)
            ->putJson(route('api.v1.roomTypes.streaming.update', ['roomType' => $lecture]), $data)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['default_pause_image']);

        // Test with valid file
        $data['default_pause_image'] = $this->file_valid;
        $result = $this->actingAs($this->user)
            ->putJson(route('api.v1.roomTypes.streaming.update', ['roomType' => $lecture]), $data)
            ->assertSuccessful();
        $this->assertNotNull($result->json('data.default_pause_image'));
        $lecture->streamingSettings->refresh();
        $this->assertStringStartsWith(url('/storage/images/'), $lecture->streamingSettings->default_pause_image);

        // Validate if the file is not deleted if request is empty
        unset($data['default_pause_image']);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.roomTypes.streaming.update', ['roomType' => $lecture]), $data)
            ->assertSuccessful();
        $lecture->streamingSettings->refresh();
        $this->assertNotNull($lecture->streamingSettings->default_pause_image);

        // Validate if the file is deleted if default_pause_image is null
        $data['default_pause_image'] = null;
        $result = $this->actingAs($this->user)
            ->putJson(route('api.v1.roomTypes.streaming.update', ['roomType' => $lecture]), $data)
            ->assertSuccessful();
        $this->assertNull($result->json('data.default_pause_image'));
        $lecture->streamingSettings->refresh();
        $this->assertNull($lecture->streamingSettings->default_pause_image);

        // Disable streaming globally, route should be disabled
        config(['streaming.enabled' => false]);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.roomTypes.streaming.update', ['roomType' => $lecture]), $data)
            ->assertNotFound();
    }
}
