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

        if ($data->servers->wipe) {
            $this->provision->server->destroy();
        }
        Log::notice('Provisioning {n} servers', ['n' => count($data->servers->add)]);
        foreach ($data->servers->add as $item) {
            $this->provision->server->create($item);
        }
    }
}
