<?php

namespace App\Console\Commands;

use App\Services\ProvisioningService;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

use function Laravel\Prompts\error;
use function Laravel\Prompts\info;

class ProvisionCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'provision:all {path : path to a JSON file containing provisioning data}';

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

        try {
            DB::beginTransaction();

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
            if ($data->users->wipe) {
                $this->provision->user->destroy();
            }

            // Add new instances
            $n = count($data->servers->add);
            info("Provisioning $n servers");
            foreach ($data->servers->add as $item) {
                $this->provision->server->create($item);
            }

            $n = count($data->server_pools->add);
            info("Provisioning $n server pools");
            foreach ($data->server_pools->add as $item) {
                $this->provision->serverPool->create($item);
            }

            $n = count($data->room_types->add);
            info("Provisioning $n room types");
            foreach ($data->room_types->add as $item) {
                $this->provision->roomType->create($item);
            }

            $n = count($data->roles->add);
            info("Provisioning $n roles");
            foreach ($data->roles->add as $item) {
                $item->permissions = (array) $item->permissions;
                $this->provision->role->create($item);
            }

            $n = count($data->users->add);
            info("Provisioning $n users");
            foreach ($data->users->add as $item) {
                $this->provision->user->create($item);
            }

            $n = array_sum(array_map(fn ($v) => count(get_object_vars($v)), get_object_vars($data->settings)));
            info("Provisioning $n settings");
            foreach (get_object_vars($data->settings) as $section => $settings) {
                $data->settings->{$section} = (array) $settings;
            }
            $this->provision->settings->set($data->settings);

            DB::commit();
        } catch (Exception $err) {
            error("Provisioning failed, aborting transaction: {$err->getMessage()}");
            DB::rollBack();

            return 1;
        }
    }
}
