<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\ProvisioningService;
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

    /**
     * Execute the console command.
     */
    public function handle(ProvisioningService $provision)
    {
        $data = json_decode(file_get_contents($this->argument('path')));

        try {
            DB::beginTransaction();

            // Wipe existing data (order is important!)
            if ($data?->room_types?->wipe ?? false) {
                $provision->roomType->destroy();
            }
            if ($data?->server_pools?->wipe ?? false) {
                $provision->serverPool->destroy();
            }
            if ($data?->servers?->wipe ?? false) {
                $provision->server->destroy();
            }
            if ($data?->roles?->wipe ?? false) {
                $provision->role->destroy();
            }
            if ($data?->users?->wipe ?? false) {
                $provision->user->destroy();
            }

            // Add new instances

            if (isset($data->servers)) {
                $n = count($data->servers->add ?? []);
                info("Provisioning $n servers");
                foreach ($data->servers->add ?? [] as $item) {
                    $provision->server->create($item);
                }
            }

            if (isset($data->server_pools)) {
                $n = count($data->server_pools->add ?? []);
                info("Provisioning $n server pools");
                foreach ($data->server_pools->add ?? [] as $item) {
                    $provision->serverPool->create($item);
                }
            }

            if (isset($data->room_types)) {
                $n = count($data->room_types->add ?? []);
                info("Provisioning $n room types");
                foreach ($data->room_types->add ?? [] as $item) {
                    $provision->roomType->create($item);
                }
            }

            if (isset($data->roles)) {
                $n = count($data->roles->add ?? []);
                info("Provisioning $n roles");
                foreach ($data->roles->add ?? [] as $item) {
                    $item->permissions = (array) $item->permissions;
                    $provision->role->create($item);
                }
            }

            if (isset($data->users)) {
                $n = count($data->users->add ?? []);
                info("Provisioning $n users");
                foreach ($data->users->add ?? [] as $item) {
                    $provision->user->create($item);
                }
            }

            if (isset($data->settings)) {
                $n = array_sum(array_map(fn ($v) => count(get_object_vars($v)), get_object_vars($data->settings)));
                info("Provisioning $n settings");
                foreach (get_object_vars($data->settings) as $section => $settings) {
                    $data->settings->{$section} = (array) $settings;
                }
                $provision->settings->set($data->settings);
            }

            DB::commit();
        } catch (\Throwable $err) {
            error("Provisioning failed, aborting transaction: {$err->getMessage()}");
            DB::rollBack();

            return 1;
        }
    }
}
