<?php

namespace Database\Seeders;

use App\Server;
use App\ServerPool;
use Illuminate\Database\Seeder;

class ServerPoolSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Only create server pools if none exits
        if (ServerPool::all()->count() == 0) {
            $default = ServerPool::create(['name' => 'Default', 'description' => '']);
            $default->servers()->sync(Server::all());
        }
    }
}
