<?php

namespace Database\Seeders;

use App\Enums\ServerStatus;
use App\Server;
use App\ServerPool;
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
        $servers = config('bigbluebutton.testserver');

        foreach ($servers as $server){
            $server = Server::create(['base_url' => $server->url,'salt' => $server->secret,'name' => $faker->unique()->word, 'status' => ServerStatus::ONLINE]);
            foreach(ServerPool::all() as $serverPool){
                $serverPool->servers()->attach($server);
            }
        }




    }
}
