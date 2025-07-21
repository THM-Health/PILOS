<?php

namespace Tests\Backend\Feature;

use App\Enums\ServerStatus;
use App\Models\Meeting;
use App\Models\Recording;
use App\Models\RoomFile;
use App\Models\Server;
use App\Models\Session;
use App\Models\User;
use App\Prometheus\Counter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Backend\TestCase;

class MetricsTest extends TestCase
{
    use RefreshDatabase;

    private function getMetrics(): array
    {
        return collect(Str::of($this->get('metrics')->getContent())
            ->explode("\n")
            ->filter(fn (string $line) => ! Str::startsWith($line, '#') && $line != '')
            ->mapWithKeys(function (string $line) {
                $data = Str::of($line)->explode(' ');

                return [$data[0] => $data[1]];
            }))->all();
    }

    public function test_metrics_disabled()
    {
        config(['metrics.enabled' => false]);

        $response = $this->get('metrics');
        $response->assertNotFound();
    }

    public function test_metrics_enabled()
    {
        $response = $this->get('metrics');
        $response->assertOk();
    }

    public function test_login_counter_metrics()
    {
        Counter::get('login_failed_total')->incBy(10, ['ldap']);
        Counter::get('login_failed_total')->incBy(20, ['local']);
        Counter::get('login_failed_total')->incBy(30, ['shibboleth']);
        Counter::get('login_total')->incBy(40, ['ldap']);
        Counter::get('login_total')->incBy(50, ['local']);
        Counter::get('login_total')->incBy(60, ['shibboleth']);

        $metrics = $this->getMetrics();
        $this->assertEquals(10, $metrics['pilos_login_failed_total{provider="ldap"}']);
        $this->assertEquals(20, $metrics['pilos_login_failed_total{provider="local"}']);
        $this->assertEquals(30, $metrics['pilos_login_failed_total{provider="shibboleth"}']);
        $this->assertEquals(40, $metrics['pilos_login_total{provider="ldap"}']);
        $this->assertEquals(50, $metrics['pilos_login_total{provider="local"}']);
        $this->assertEquals(60, $metrics['pilos_login_total{provider="shibboleth"}']);

        // Get metrics again, without changing the counters
        $metrics = $this->getMetrics();
        $this->assertEquals(10, $metrics['pilos_login_failed_total{provider="ldap"}']);
        $this->assertEquals(20, $metrics['pilos_login_failed_total{provider="local"}']);
        $this->assertEquals(30, $metrics['pilos_login_failed_total{provider="shibboleth"}']);
        $this->assertEquals(40, $metrics['pilos_login_total{provider="ldap"}']);
        $this->assertEquals(50, $metrics['pilos_login_total{provider="local"}']);
        $this->assertEquals(60, $metrics['pilos_login_total{provider="shibboleth"}']);

        // Increase the counters
        Counter::get('login_failed_total')->incBy(1, ['ldap']);
        Counter::get('login_failed_total')->incBy(2, ['local']);
        Counter::get('login_failed_total')->incBy(3, ['shibboleth']);
        Counter::get('login_total')->incBy(4, ['ldap']);
        Counter::get('login_total')->incBy(5, ['local']);
        Counter::get('login_total')->incBy(6, ['shibboleth']);

        // Get metrics again, after changing the counters
        $metrics = $this->getMetrics();
        $this->assertEquals(11, $metrics['pilos_login_failed_total{provider="ldap"}']);
        $this->assertEquals(22, $metrics['pilos_login_failed_total{provider="local"}']);
        $this->assertEquals(33, $metrics['pilos_login_failed_total{provider="shibboleth"}']);
        $this->assertEquals(44, $metrics['pilos_login_total{provider="ldap"}']);
        $this->assertEquals(55, $metrics['pilos_login_total{provider="local"}']);
        $this->assertEquals(66, $metrics['pilos_login_total{provider="shibboleth"}']);
    }

    public function test_room_counter_metrics()
    {
        Counter::get('room_authentication_errors_total')->incBy(10, ['access_code_invalid']);
        Counter::get('room_authentication_errors_total')->incBy(20, ['guest_access']);
        Counter::get('room_authentication_errors_total')->incBy(30, ['token']);
        Counter::get('room_started_total')->incBy(40);
        Counter::get('room_start_errors_total')->incBy(50, ['no_server_found']);
        Counter::get('room_start_errors_total')->incBy(60, ['start_failed']);
        Counter::get('room_joined_total')->incBy(70);
        Counter::get('room_join_errors_total')->incBy(80, ['checking_meeting_running_on_server_error']);
        Counter::get('room_join_errors_total')->incBy(90, ['meeting_not_running_on_server']);

        $metrics = $this->getMetrics();
        $this->assertEquals(10, $metrics['pilos_room_authentication_errors_total{error_type="access_code_invalid"}']);
        $this->assertEquals(20, $metrics['pilos_room_authentication_errors_total{error_type="guest_access"}']);
        $this->assertEquals(30, $metrics['pilos_room_authentication_errors_total{error_type="token"}']);
        $this->assertEquals(40, $metrics['pilos_room_started_total']);
        $this->assertEquals(50, $metrics['pilos_room_start_errors_total{error_type="no_server_found"}']);
        $this->assertEquals(60, $metrics['pilos_room_start_errors_total{error_type="start_failed"}']);
        $this->assertEquals(70, $metrics['pilos_room_joined_total']);
        $this->assertEquals(80, $metrics['pilos_room_join_errors_total{error_type="checking_meeting_running_on_server_error"}']);
        $this->assertEquals(90, $metrics['pilos_room_join_errors_total{error_type="meeting_not_running_on_server"}']);

        // Get metrics again, without changing the counters
        $metrics = $this->getMetrics();
        $this->assertEquals(10, $metrics['pilos_room_authentication_errors_total{error_type="access_code_invalid"}']);
        $this->assertEquals(20, $metrics['pilos_room_authentication_errors_total{error_type="guest_access"}']);
        $this->assertEquals(30, $metrics['pilos_room_authentication_errors_total{error_type="token"}']);
        $this->assertEquals(40, $metrics['pilos_room_started_total']);
        $this->assertEquals(50, $metrics['pilos_room_start_errors_total{error_type="no_server_found"}']);
        $this->assertEquals(60, $metrics['pilos_room_start_errors_total{error_type="start_failed"}']);
        $this->assertEquals(70, $metrics['pilos_room_joined_total']);
        $this->assertEquals(80, $metrics['pilos_room_join_errors_total{error_type="checking_meeting_running_on_server_error"}']);
        $this->assertEquals(90, $metrics['pilos_room_join_errors_total{error_type="meeting_not_running_on_server"}']);

        // Increase the counters
        Counter::get('room_authentication_errors_total')->incBy(1, ['access_code_invalid']);
        Counter::get('room_authentication_errors_total')->incBy(2, ['guest_access']);
        Counter::get('room_authentication_errors_total')->incBy(3, ['token']);
        Counter::get('room_started_total')->incBy(4);
        Counter::get('room_start_errors_total')->incBy(5, ['no_server_found']);
        Counter::get('room_start_errors_total')->incBy(6, ['start_failed']);
        Counter::get('room_joined_total')->incBy(7);
        Counter::get('room_join_errors_total')->incBy(8, ['checking_meeting_running_on_server_error']);
        Counter::get('room_join_errors_total')->incBy(9, ['meeting_not_running_on_server']);
        // Get metrics again, after changing the counters
        $metrics = $this->getMetrics();
        $this->assertEquals(11, $metrics['pilos_room_authentication_errors_total{error_type="access_code_invalid"}']);
        $this->assertEquals(22, $metrics['pilos_room_authentication_errors_total{error_type="guest_access"}']);
        $this->assertEquals(33, $metrics['pilos_room_authentication_errors_total{error_type="token"}']);
        $this->assertEquals(44, $metrics['pilos_room_started_total']);
        $this->assertEquals(55, $metrics['pilos_room_start_errors_total{error_type="no_server_found"}']);
        $this->assertEquals(66, $metrics['pilos_room_start_errors_total{error_type="start_failed"}']);
        $this->assertEquals(77, $metrics['pilos_room_joined_total']);
        $this->assertEquals(88, $metrics['pilos_room_join_errors_total{error_type="checking_meeting_running_on_server_error"}']);
        $this->assertEquals(99, $metrics['pilos_room_join_errors_total{error_type="meeting_not_running_on_server"}']);
    }

    public function test_room_gauge_metrics()
    {
        RoomFile::factory()->count(10)->create();
        Meeting::factory()->count(25)->create();
        Meeting::factory()->count(5)->create(['end' => null]);
        Recording::factory()->count(30)->create();

        $metrics = $this->getMetrics();
        $this->assertEquals(10, $metrics['pilos_files_total']);
        $this->assertEquals(30, $metrics['pilos_meetings_total']);
        $this->assertEquals(5, $metrics['pilos_running_meetings_total']);
        $this->assertEquals(30, $metrics['pilos_recordings_total']);
        $this->assertEquals(70, $metrics['pilos_rooms_total']);

        // Get metrics again, without changing the counters
        $metrics = $this->getMetrics();
        $this->assertEquals(10, $metrics['pilos_files_total']);
        $this->assertEquals(30, $metrics['pilos_meetings_total']);
        $this->assertEquals(5, $metrics['pilos_running_meetings_total']);
        $this->assertEquals(30, $metrics['pilos_recordings_total']);
        $this->assertEquals(70, $metrics['pilos_rooms_total']);

        // Create more files, meetings, recordings
        RoomFile::factory()->count(5)->create();
        Meeting::factory()->count(5)->create();
        Recording::factory()->count(5)->create();

        // Get metrics again, after adding more files, meetings, recordings
        $metrics = $this->getMetrics();
        $this->assertEquals(15, $metrics['pilos_files_total']);
        $this->assertEquals(35, $metrics['pilos_meetings_total']);
        $this->assertEquals(5, $metrics['pilos_running_meetings_total']);
        $this->assertEquals(35, $metrics['pilos_recordings_total']);
        $this->assertEquals(85, $metrics['pilos_rooms_total']);
    }

    public function test_user_gauge_metrics()
    {
        User::factory()->count(10)->create();
        Session::factory()->count(5)->create(['last_activity' => now()]);

        $metrics = $this->getMetrics();
        $this->assertEquals(15, $metrics['pilos_users_total']);
        $this->assertEquals(5, $metrics['pilos_active_sessions_total']);

        // Get metrics again, without changing the counters
        $metrics = $this->getMetrics();
        $this->assertEquals(15, $metrics['pilos_users_total']);
        $this->assertEquals(5, $metrics['pilos_active_sessions_total']);

        // Create more users
        User::factory()->count(5)->create();
        Session::factory()->count(5)->create();

        // Get metrics again, after adding more files, meetings, recordings
        $metrics = $this->getMetrics();
        $this->assertEquals(25, $metrics['pilos_users_total']);
        $this->assertEquals(10, $metrics['pilos_active_sessions_total']);
    }

    public function test_server_gauge_metrics()
    {
        config(['bigbluebutton.server_online_threshold' => 3]);
        config(['bigbluebutton.server_offline_threshold' => 3]);

        $disabled = Server::factory()->count(10)->create(['status' => ServerStatus::DISABLED]);
        $draining = Server::factory()->count(20)->create(['status' => ServerStatus::DRAINING]);
        $unhealthy = Server::factory()->count(30)->create(['status' => ServerStatus::ENABLED, 'recover_count' => 1, 'error_count' => 1]);
        $offline = Server::factory()->count(40)->create(['status' => ServerStatus::ENABLED, 'recover_count' => 0, 'error_count' => 3]);
        $online = Server::factory()->count(50)->create(['status' => ServerStatus::ENABLED, 'recover_count' => 3, 'error_count' => 0]);

        $metrics = $this->getMetrics();
        $this->assertEquals(10, $metrics['pilos_servers_total{status="disabled"}']);
        $this->assertEquals(20, $metrics['pilos_servers_total{status="draining"}']);
        $this->assertEquals(30, $metrics['pilos_servers_total{status="unhealthy"}']);
        $this->assertEquals(40, $metrics['pilos_servers_total{status="offline"}']);
        $this->assertEquals(50, $metrics['pilos_servers_total{status="online"}']);

        // Get metrics again, without changing the data
        $metrics = $this->getMetrics();
        $this->assertEquals(10, $metrics['pilos_servers_total{status="disabled"}']);
        $this->assertEquals(20, $metrics['pilos_servers_total{status="draining"}']);
        $this->assertEquals(30, $metrics['pilos_servers_total{status="unhealthy"}']);
        $this->assertEquals(40, $metrics['pilos_servers_total{status="offline"}']);
        $this->assertEquals(50, $metrics['pilos_servers_total{status="online"}']);

        // Change server statuses
        $disabled[0]->status = ServerStatus::ENABLED;
        $disabled[0]->save();

        $draining[0]->status = ServerStatus::ENABLED;
        $draining[0]->save();

        $unhealthy[0]->error_count = 0;
        $unhealthy[0]->recover_count = 3;
        $unhealthy[0]->save();

        $offline[0]->error_count = 0;
        $offline[0]->recover_count = 3;
        $offline[0]->save();

        $online[0]->status = ServerStatus::DISABLED;
        $online[0]->save();
        $online[0]->delete();

        // Get metrics again, after changing the server statuses
        $metrics = $this->getMetrics();
        $this->assertEquals(9, $metrics['pilos_servers_total{status="disabled"}']);
        $this->assertEquals(19, $metrics['pilos_servers_total{status="draining"}']);
        $this->assertEquals(29, $metrics['pilos_servers_total{status="unhealthy"}']);
        $this->assertEquals(39, $metrics['pilos_servers_total{status="offline"}']);
        $this->assertEquals(53, $metrics['pilos_servers_total{status="online"}']);
    }
}
