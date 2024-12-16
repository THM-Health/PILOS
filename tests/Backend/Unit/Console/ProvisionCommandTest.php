<?php

namespace Tests\Backend\Unit\Console;

use App\Models\Role;
use App\Models\RoomType;
use App\Models\Server;
use App\Models\ServerPool;
use App\Models\User;
use App\Settings\GeneralSettings;
use App\Settings\RecordingSettings;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Backend\TestCase;

class ProvisionCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_provisioning()
    {
        $data_path = __DIR__.'/../../Fixtures/provisioning_data.json';
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->artisan("provision:all $data_path")->assertSuccessful();
        $this->assertEquals(2, count(Server::all()));
        $this->assertNotNull(Server::firstWhere('name', 'Default server'));
        $this->assertEquals(2, count(ServerPool::all()));
        $this->assertNotNull(ServerPool::firstWhere('name', 'performance'));
        $this->assertEquals(2, count(RoomType::all()));
        $this->assertNotNull(RoomType::firstWhere('name', 'Meeting'));
        $this->assertEquals(3, count(Role::all()));
        $this->assertNotNull(Role::firstWhere('name', 'Admin'));
        $this->assertEquals(1, count(User::all()));
        $this->assertNotNull(User::firstWhere('email', 'moss@reynholm-industries.co.uk'));
        $this->assertEquals('Example company - PILOS', app(GeneralSettings::class)->name);
        $this->assertEquals(730, app(RecordingSettings::class)->recording_retention_period->value);
    }
}
