<?php

declare(strict_types=1);

namespace Tests\Backend\Unit;

use App\Enums\ServerConnectionStatus;
use App\Enums\ServerStatus;
use App\Models\Server;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Backend\TestCase;

class ServerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test if closure resets current usage for disabled
     */
    public function test_usage_cleared_on_disabled()
    {
        // Create new fake server
        $server = Server::factory()->create();

        // Set the live usage data of server
        $server->participant_count = 1;
        $server->listener_count = 2;
        $server->voice_participant_count = 3;
        $server->video_count = 4;
        $server->meeting_count = 5;
        $server->version = '2.4.5';
        $server->status = ServerStatus::ENABLED;
        $server->save();

        $server->refresh();
        $server->status = ServerStatus::DISABLED;
        $server->save();

        // Reload data and check if everything is reset, as the server is disabled
        $server->refresh();
        $this->assertEquals(ServerStatus::DISABLED, $server->status);
        $this->assertNull($server->participant_count);
        $this->assertNull($server->listener_count);
        $this->assertNull($server->voice_participant_count);
        $this->assertNull($server->video_count);
        $this->assertNull($server->meeting_count);
        $this->assertNull($server->version);
    }

    public function test_server_connection_status()
    {
        config([
            'bigbluebutton.server_online_threshold' => 3,
            'bigbluebutton.server_offline_threshold' => 3,
        ]);

        // Check online
        $server = Server::factory()->create();
        $server->error_count = 0;
        $server->recover_count = config('bigbluebutton.server_online_threshold');
        $server->save();

        $this->assertEquals(ServerConnectionStatus::ONLINE, $server->connection_status);

        // Check failing
        $server->error_count = 1;
        $server->recover_count = 0;
        $server->save();

        $this->assertEquals(ServerConnectionStatus::FAULTY, $server->connection_status);

        // Check offline
        $server->error_count = config('bigbluebutton.server_offline_threshold');
        $server->recover_count = 0;
        $server->save();

        $this->assertEquals(ServerConnectionStatus::OFFLINE, $server->connection_status);

        // Check disabled
        $server->status = ServerStatus::DISABLED;
        $server->error_count = 0;
        $server->recover_count = config('bigbluebutton.server_online_threshold');
        $server->save();
        $this->assertNull($server->connection_status);

        // Check always online
        $server->status = ServerStatus::ENABLED;
        $server->connection_status_always_online = true;
        $server->error_count = 1;
        $server->recover_count = 1;
        $server->save();
        $this->assertEquals(ServerConnectionStatus::ONLINE, $server->connection_status);

        // Check always online and disabled
        $server->status = ServerStatus::DISABLED;
        $server->connection_status_always_online = true;
        $server->error_count = 1;
        $server->recover_count = 1;
        $server->save();
        $this->assertNull($server->connection_status);
    }
}
