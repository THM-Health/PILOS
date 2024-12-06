<?php

namespace App\Services;

use App\Enums\ServerStatus;
use App\Models\Server;
use Log;

interface Provisioner
{
    public function create(object $properties);

    // public function read(array $match): object;

    // public function update(array $match, object $properties);

    public function destroy(array $match = []);
}

class ServerProvisioner implements Provisioner
{
    public function create(object $properties)
    {
        Log::notice("Provisioning server '$properties->name'");
        $srv = new Server;
        $srv->name = $properties->name;
        $srv->description = $properties->description;
        $srv->base_url = $properties->endpoint;
        $srv->secret = $properties->secret;
        $srv->strength = $properties->strength;
        // TODO: PHP 8.3 allows the following syntax
        // ServerStatus::{strtoupper($properties->status)}->value;
        $status = strtoupper($properties->status);
        $srv->status = \constant("App\Enums\ServerStatus::$status")->value;
        $srv->save();
    }

    public function destroy(array $match = [])
    {
        if ($match) {
            $expression = implode(' && ', array_map(fn ($a, $b) => "$a = $b", array_keys($match), array_values($match)));
            Log::notice("Deleting all servers matching '$expression'");
        } else {
            Log::notice('Deleting all servers');
        }
        $srvs = Server::lazy();
        foreach ($match as $key => $value) {
            $srvs = $srvs->where($key, $value);
        }
        foreach ($srvs as $item) {
            $item->status = ServerStatus::DISABLED;
            if (! $item->delete()) {
                Log::error("Failed to delete server '$item->name'");
            }
        }
    }
}

class ProvisioningService
{
    public ServerProvisioner $server;

    public function __construct()
    {
        $this->server = new ServerProvisioner;
    }
}
