<?php

namespace App\Console\Commands;

use App\Services\ProvisioningService;
use Illuminate\Console\Command;
use Log;

class ProvisionCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:provision {path : path to a JSON file containing provisioning data}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Provision this PILOS instance';

    public function __construct(protected ProvisioningService $provision)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $data = json_decode(file_get_contents($this->argument('path')));

        // Wipe existing data (order is important!)
        if ($data->room_types->wipe) {
            $this->provision->roomType->destroy();
        }
        if ($data->server_pools->wipe) {
            $this->provision->serverPool->destroy();
        }
        if ($data->servers->wipe) {
            $this->provision->server->destroy();
        }
        if ($data->roles->wipe) {
            $this->provision->role->destroy();
        }

        // Add new instances
        Log::notice('Provisioning {n} servers', ['n' => count($data->servers->add)]);
        foreach ($data->servers->add as $item) {
            $this->provision->server->create($item);
        }

        Log::notice('Provisioning {n} server pools', ['n' => count($data->server_pools->add)]);
        foreach ($data->server_pools->add as $item) {
            $this->provision->serverPool->create($item);
        }

        Log::notice('Provisioning {n} room types', ['n' => count($data->room_types->add)]);
        foreach ($data->room_types->add as $item) {
            $this->provision->roomType->create($item);
        }

        Log::notice('Provisioning {n} roles', ['n' => count($data->roles->add)]);
        foreach ($data->roles->add as $item) {
            $item->permissions = (array) $item->permissions;
            $this->provision->role->create($item);
        }
    }
}
