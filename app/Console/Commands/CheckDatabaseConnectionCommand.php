<?php

// SPDX-FileCopyrightText: 2023 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Console\Commands;

use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckDatabaseConnectionCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check the database connection.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            DB::connection()->getPDO();
            $this->info('Successfully connected to the database.');

            return 0;
        } catch (Exception $e) {
            $this->error('Connecting to the database failed.');

            return 1;
        }
    }
}
