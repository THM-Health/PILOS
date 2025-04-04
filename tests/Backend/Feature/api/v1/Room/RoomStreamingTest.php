<?php

namespace Tests\Backend\Feature\api\v1\Room;

use App\Enums\CustomStatusCodes;
use App\Enums\RoomUserRole;
use App\Models\Meeting;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Room;
use App\Models\Server;
use App\Models\User;
use App\Services\StreamingService;
use App\Services\StreamingServiceFactory;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Storage;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\Backend\TestCase;

class RoomStreamingTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * Setup resources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->user = User::factory()->create();
        $this->role = Role::factory()->create();
        $this->managePermission = Permission::factory()->create(['name' => 'rooms.manage']);
        $this->viewAllPermission = Permission::factory()->create(['name' => 'rooms.viewAll']);
        $this->room = Room::factory()->create();

        // Enable streaming
        config(['streaming.enabled' => true]);
        $this->room->roomType->streamingSettings->enabled = true;
        $this->room->roomType->streamingSettings->save();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->role = Role::factory()->create();
        $this->managePermission = Permission::where('name', 'rooms.manage')->first();
        $this->viewAllPermission = Permission::where('name', 'rooms.viewAll')->first();

        $this->file_valid = UploadedFile::fake()->image('image.jpg', 1920, 1080);
        $this->file_wrongmime = UploadedFile::fake()->image('image.svg', 1920, 1080);
        $this->file_wrongdimensions = UploadedFile::fake()->image('image.jpg', 1080, 1920);
        $this->file_toobig = UploadedFile::fake()->create('image.jpg', 5001, 'image/jpeg');

    }

    /**
     * Test access to streaming settings
     */
    public function test_access_streaming_settings()
    {

        // Testing guests
        $this->getJson(route('api.v1.rooms.streaming.config.get', ['room' => $this->room]))
            ->assertUnauthorized();

        // Testing user
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.streaming.config.get', ['room' => $this->room]))
            ->assertForbidden();

        // Testing member
        $this->room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.streaming.config.get', ['room' => $this->room]))
            ->assertForbidden();

        // Testing moderator member
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.streaming.config.get', ['room' => $this->room]))
            ->assertForbidden();

        // Testing co-owner member
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.streaming.config.get', ['room' => $this->room]))
            ->assertSuccessful();

        // Testing owner
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.streaming.config.get', ['room' => $this->room]))
            ->assertSuccessful();

        // Remove membership roles
        $this->room->members()->sync([]);

        // Testing view all permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.streaming.config.get', ['room' => $this->room]))
            ->assertSuccessful();

        // Testing manage permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.streaming.config.get', ['room' => $this->room]))
            ->assertSuccessful();
    }

    /**
     * Test streaming settings
     */
    public function test_streaming_settings()
    {
        $streamingSettings = app(\App\Settings\StreamingSettings::class);

        // Test default values
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.streaming.config.get', ['room' => $this->room]))
            ->assertJson([
                'data' => [
                    'enabled' => false,
                    'url' => null,
                    'pause_image' => null,
                    'room_type_default_pause_image' => null,
                    'system_default_pause_image' => null,
                ]]
            );

        // Enable streaming
        $this->room->streaming->enabled = true;
        $this->room->streaming->url = 'rtmp://example.com/live/1234';
        $this->room->streaming->pause_image = 'https://example.com/image.jpg';
        $this->room->streaming->save();

        // Test attributes are correctly set
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.streaming.config.get', ['room' => $this->room]))
            ->assertJson([
                'data' => [
                    'enabled' => true,
                    'url' => 'rtmp://example.com/live/1234',
                    'pause_image' => 'https://example.com/image.jpg',
                    'room_type_default_pause_image' => null,
                    'system_default_pause_image' => null,
                ]]
            );

        // Disable streaming globally
        config(['streaming.enabled' => false]);

        // Test if streaming enabled status is disabled
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.streaming.config.get', ['room' => $this->room]))
            ->assertJsonPath('data.enabled', false);
        config(['streaming.enabled' => true]);

        // Disable streaming for the room type
        $this->room->roomType->streamingSettings->enabled = false;
        $this->room->roomType->streamingSettings->save();
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.streaming.config.get', ['room' => $this->room]))
            ->assertJsonPath('data.enabled', false);
        $this->room->roomType->streamingSettings->enabled = true;
        $this->room->roomType->streamingSettings->save();

        // Set default pause image for room type and system
        $this->room->roomType->streamingSettings->default_pause_image = 'https://example.com/room_type_default_image.jpg';
        $this->room->roomType->streamingSettings->save();
        $streamingSettings->default_pause_image = 'https://example.com/system_default_image.jpg';
        $streamingSettings->save();
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.streaming.config.get', ['room' => $this->room]))
            ->assertJsonPath('data.room_type_default_pause_image', 'https://example.com/room_type_default_image.jpg')
            ->assertJsonPath('data.system_default_pause_image', 'https://example.com/system_default_image.jpg');
    }

    /**
     * Test changing room streaming settings
     */
    public function test_update_streaming_settings()
    {
        $data = [
            'enabled' => true,
            'url' => 'rtmp://example.com/live/1234',
        ];

        // Testing guests
        $this->putJson(route('api.v1.rooms.streaming.config.update', ['room' => $this->room]), $data)
            ->assertUnauthorized();

        // Testing user
        $this->actingAs($this->user)
            ->putJson(route('api.v1.rooms.streaming.config.update', ['room' => $this->room]), $data)
            ->assertForbidden();

        // Testing member
        $this->room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.rooms.streaming.config.update', ['room' => $this->room]), $data)
            ->assertForbidden();

        // Testing moderator member
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.rooms.streaming.config.update', ['room' => $this->room]), $data)
            ->assertForbidden();

        // Testing co-owner member
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.rooms.streaming.config.update', ['room' => $this->room]), $data)
            ->assertSuccessful();

        // Testing owner
        $this->actingAs($this->room->owner)
            ->putJson(route('api.v1.rooms.streaming.config.update', ['room' => $this->room]), $data)
            ->assertSuccessful();

        // Remove membership roles
        $this->room->members()->sync([]);

        // Testing view all permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.rooms.streaming.config.update', ['room' => $this->room]), $data)
            ->assertForbidden();

        // Testing manage permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.rooms.streaming.config.update', ['room' => $this->room]), $data)
            ->assertSuccessful();

        // Test if changes are saved
        $this->room->streaming->refresh();
        $this->assertTrue($this->room->streaming->enabled);
        $this->assertEquals('rtmp://example.com/live/1234', $this->room->streaming->url);

        // Test invalid URL
        $data['url'] = 'invalid-url';
        $this->actingAs($this->room->owner)
            ->putJson(route('api.v1.rooms.streaming.config.update', ['room' => $this->room]), $data)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['url']);

        // Test missing URL
        unset($data['url']);
        $this->actingAs($this->room->owner)
            ->putJson(route('api.v1.rooms.streaming.config.update', ['room' => $this->room]), $data)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['url']);

        // Test missing URL if streaming disabled
        $data['enabled'] = false;
        $this->actingAs($this->room->owner)
            ->putJson(route('api.v1.rooms.streaming.config.update', ['room' => $this->room]), $data)
            ->assertSuccessful();

        // Test if changes are saved
        $this->room->streaming->refresh();
        $this->assertFalse($this->room->streaming->enabled);
        $this->assertNull($this->room->streaming->url);

        // Test invalid url image if streaming disabled
        $data['url'] = 'https://example.com/live/1234';
        $this->actingAs($this->room->owner)
            ->putJson(route('api.v1.rooms.streaming.config.update', ['room' => $this->room]), $data)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['url']);

        // Test valid image
        $data['enabled'] = true;
        $data['url'] = 'rtmps://example.com/live/1234';
        $data['pause_image'] = $this->file_valid;

        $this->actingAs($this->room->owner)
            ->putJson(route('api.v1.rooms.streaming.config.update', ['room' => $this->room]), $data)
            ->assertSuccessful();

        // Test if changes are saved
        $this->room->streaming->refresh();
        $this->assertTrue($this->room->streaming->enabled);
        $this->assertEquals('rtmps://example.com/live/1234', $this->room->streaming->url);
        $this->assertStringStartsWith(url('/storage/images/'), $this->room->streaming->pause_image);

        // Test image with wrong mime type
        $data['pause_image'] = $this->file_wrongmime;
        $this->actingAs($this->room->owner)
            ->putJson(route('api.v1.rooms.streaming.config.update', ['room' => $this->room]), $data)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['pause_image']);

        // Test image with wrong dimensions
        $data['pause_image'] = $this->file_wrongdimensions;
        $this->actingAs($this->room->owner)
            ->putJson(route('api.v1.rooms.streaming.config.update', ['room' => $this->room]), $data)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['pause_image']);

        // Test image too big
        $data['pause_image'] = $this->file_toobig;
        $this->actingAs($this->room->owner)
            ->putJson(route('api.v1.rooms.streaming.config.update', ['room' => $this->room]), $data)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['pause_image']);

        // Test image removal
        $data['pause_image'] = null;
        $this->actingAs($this->room->owner)
            ->putJson(route('api.v1.rooms.streaming.config.update', ['room' => $this->room]), $data)
            ->assertSuccessful();
        $this->room->streaming->refresh();
        $this->assertNull($this->room->streaming->pause_image_url);
    }

    /**
     * Test access to streaming status
     */
    public function test_access_streaming_status()
    {
        // Testing guests
        $this->getJson(route('api.v1.rooms.streaming.status', ['room' => $this->room]))
            ->assertUnauthorized();

        // Testing user
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.streaming.status', ['room' => $this->room]))
            ->assertForbidden();

        // Testing member
        $this->room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.streaming.status', ['room' => $this->room]))
            ->assertForbidden();

        // Testing moderator member
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.streaming.status', ['room' => $this->room]))
            ->assertForbidden();

        // Testing co-owner member
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.streaming.status', ['room' => $this->room]))
            ->assertSuccessful();

        // Testing owner
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.streaming.status', ['room' => $this->room]))
            ->assertSuccessful();

        // Remove membership roles
        $this->room->members()->sync([]);

        // Testing view all permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.streaming.status', ['room' => $this->room]))
            ->assertSuccessful();

        // Testing manage permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.streaming.status', ['room' => $this->room]))
            ->assertSuccessful();
    }

    public function test_streaming_status()
    {
        config([
            'streaming.refresh_interval' => 10,
        ]);

        // Create new meeting
        $meeting = new Meeting;
        $meeting->room()->associate($this->room);
        $meeting->start = now();
        $meeting->server()->associate(Server::factory()->create(['base_url' => 'https://bbb.example.com/bigbluebutton/']));
        $meeting->save();
        $this->room->latestMeeting()->associate($meeting);
        $this->room->save();

        // Set streaming settings
        $this->room->streaming->enabled_for_current_meeting = true;
        $this->room->streaming->save();

        // Mock the action calls to the streaming service
        $streamingServiceMock = $this->mock(StreamingService::class);
        $streamingServiceMock->shouldReceive('getStatus')->once()->andReturn(true);
        $streamingServiceMock->shouldReceive('getStatus')->once()->andReturn(true);
        $streamingServiceMock->shouldReceive('getStatus')->once()->andReturn(true);
        $streamingServiceMock->shouldReceive('getStatus')->once()->andThrow(new HttpException(CustomStatusCodes::ROOM_NOT_RUNNING->value, __('app.errors.room_not_running')));

        $factoryMock = $this->mock(StreamingServiceFactory::class);
        $factoryMock->shouldReceive('make')
            ->with(\Mockery::on(fn ($argument) => $meeting->is($argument)))
            ->andReturn($streamingServiceMock);

        $this->instance(
            StreamingServiceFactory::class,
            $factoryMock
        );

        // Get status with no data
        Cache::clear();
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.streaming.status', ['room' => $this->room]))
            ->assertSuccessful()
            ->assertJson([
                'data' => [
                    'enabled_for_current_meeting' => true,
                    'status' => null,
                    'fps' => null,
                ],
            ]);

        // Simulate streaming service updated data
        $this->room->streaming->status = 'running';
        $this->room->streaming->fps = 30;
        $this->room->streaming->save();

        // Test if the data is correctly returned
        Cache::clear();
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.streaming.status', ['room' => $this->room]))
            ->assertSuccessful()
            ->assertJson([
                'data' => [
                    'enabled_for_current_meeting' => true,
                    'status' => 'running',
                    'fps' => 30,
                ],
            ]);

        // Check if response is cached and not re-fetched
        $this->travel(5)->seconds();
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.streaming.status', ['room' => $this->room]))
            ->assertSuccessful()
            ->assertJsonPath('data.status', 'running')
            ->assertJsonPath('data.fps', 30);

        // Simulate streaming service updated data
        $this->room->streaming->status = 'running';
        $this->room->streaming->fps = 25;
        $this->room->streaming->save();

        // Check if response is re-fetched after cache expiration
        $this->travel(6)->seconds();
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.streaming.status', ['room' => $this->room]))
            ->assertSuccessful()
            ->assertJsonPath('data.status', 'running')
            ->assertJsonPath('data.fps', 25);

        // Test server responds with error, should respond with last known status
        Cache::clear();
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.streaming.status', ['room' => $this->room]))
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'running')
            ->assertJsonPath('data.fps', 25);
    }

    /**
     * Test starting streaming
     */
    public function test_start_stream()
    {
        $this->room->streaming->enabled_for_current_meeting = true;
        $this->room->streaming->save();

        $this->test_streaming_action('start', route('api.v1.rooms.streaming.start', ['room' => $this->room]));

        // Test if request is blocked if streaming is not enabled
        $this->room->streaming->enabled_for_current_meeting = false;
        $this->room->streaming->save();

        $this->actingAs($this->room->owner)
            ->postJson(route('api.v1.rooms.streaming.start', ['room' => $this->room]))
            ->assertStatus(412);
    }

    /**
     * Test pausing streaming
     */
    public function test_pause_stream()
    {
        $this->test_streaming_action('pause', route('api.v1.rooms.streaming.pause', ['room' => $this->room]));
    }

    /**
     * Test resuming streaming
     */
    public function test_resume_stream()
    {
        $this->test_streaming_action('resume', route('api.v1.rooms.streaming.resume', ['room' => $this->room]));
    }

    /**
     * Test stop streaming
     */
    public function test_stop_stream()
    {
        $this->test_streaming_action('stop', route('api.v1.rooms.streaming.stop', ['room' => $this->room]));
    }

    /** Helper for the actions pause, resume and stop */
    private function test_streaming_action(string $action, string $url): void
    {
        // Create new meeting
        $meeting = new Meeting;
        $meeting->room()->associate($this->room);
        $meeting->start = now();
        $meeting->server()->associate(Server::factory()->create(['base_url' => 'https://bbb.example.com/bigbluebutton/']));
        $meeting->save();
        $this->room->latestMeeting()->associate($meeting);
        $this->room->save();

        // Mock the action calls to the streaming service
        $streamingServiceMock = $this->mock(StreamingService::class);
        $streamingServiceMock->shouldReceive($action)->once()->andReturn(false);
        $streamingServiceMock->shouldReceive($action)->andReturn(true);

        $factoryMock = $this->mock(StreamingServiceFactory::class);
        $factoryMock->shouldReceive('make')
            ->with(\Mockery::on(fn ($argument) => $meeting->is($argument)))
            ->andReturn($streamingServiceMock);

        $this->instance(
            StreamingServiceFactory::class,
            $factoryMock
        );

        // Run action with error
        $this->actingAs($this->room->owner)
            ->postJson($url)
            ->assertServerError();

        // Run action, should report data from database if successful
        $this->room->streaming->status = 'running';
        $this->room->streaming->fps = 30;
        $this->room->streaming->save();
        $this->actingAs($this->room->owner)
            ->postJson($url)
            ->assertSuccessful()
            ->assertJson([
                'data' => [
                    'status' => 'running',
                    'fps' => 30,
                ],
            ]);

        // Test if meeting is detached
        $this->room->latestMeeting->detached = now();
        $this->room->latestMeeting->save();
        $this->actingAs($this->room->owner)
            ->postJson($url)
            ->assertStatus(CustomStatusCodes::ROOM_NOT_RUNNING->value);
        $this->room->latestMeeting->detached = null;
        $this->room->latestMeeting->save();

        // Test if meeting is ended
        $this->room->latestMeeting->end = now();
        $this->room->latestMeeting->save();
        $this->actingAs($this->room->owner)
            ->postJson($url)
            ->assertStatus(CustomStatusCodes::ROOM_NOT_RUNNING->value);
        $this->room->latestMeeting->end = null;
        $this->room->latestMeeting->save();

        // Test if no meeting exists
        $this->room->latestMeeting()->dissociate();
        $this->room->save();
        $this->actingAs($this->room->owner)
            ->postJson($url)
            ->assertStatus(CustomStatusCodes::ROOM_NOT_RUNNING->value);
        $this->room->latestMeeting()->associate($meeting);
        $this->room->save();

        // Test permissions
        \Auth::logout();

        // Testing guests
        $this->postJson($url)
            ->assertUnauthorized();

        // Testing user
        $this->actingAs($this->user)
            ->postJson($url)
            ->assertForbidden();

        // Testing member
        $this->room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)
            ->postJson($url)
            ->assertForbidden();

        // Testing moderator member
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)
            ->postJson($url)
            ->assertForbidden();

        // Testing co-owner member
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)
            ->postJson($url)
            ->assertSuccessful();

        // Remove membership roles
        $this->room->members()->sync([]);

        // Testing view all permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)
            ->postJson($url)
            ->assertForbidden();

        // Testing manage permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)
            ->postJson($url)
            ->assertSuccessful();
    }
}
