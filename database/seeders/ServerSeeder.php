<?php

namespace Database\Seeders;

use App\Enums\ServerStatus;
use App\Models\Server;
use App\Models\ServerPool;
use Faker\Factory;
use Illuminate\Database\Seeder;

class ServerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $faker = Factory::create();
        $host = config('bigbluebutton.test_server.host');
        $secret = config('bigbluebutton.test_server.secret');

        // If host or secret are not set, skip
        if (! $host || ! $secret) {
            return;
        }

        $server = Server::create([
            'base_url' => $host,
            'secret' => $secret,
            'name' => 'Test Server',
            'status' => ServerStatus::ENABLED,
            'error_count' => 0,
            'recover_count' => config('bigbluebutton.server_online_threshold'),
            'load' => 0,
        ]);

        // Attach the server to all server pools
        foreach (ServerPool::all() as $serverPool) {
            $serverPool->servers()->attach($server);
        }
    }
}
