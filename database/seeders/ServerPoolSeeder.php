<?php

// SPDX-FileCopyrightText: 2021 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Server;
use App\Models\ServerPool;
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
