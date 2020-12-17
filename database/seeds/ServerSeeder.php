<?php

use App\Server;
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
        $faker = Faker\Factory::create();
        $servers = config('bigbluebutton.testserver');

        foreach ($servers as $server){
            Server::create(['baseUrl' => $server->url,'salt' => $server->secret,'status'=>true,'description'=>$faker->word, 'status'=>\App\Enums\ServerStatus::ONLINE]);
        }


    }
}
