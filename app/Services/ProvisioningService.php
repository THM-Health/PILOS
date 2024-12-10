<?php

namespace App\Services;

use App\Enums\ServerStatus;
use App\Models\Server;
use Log;
use UnexpectedValueException;

abstract class AbstractProvisioner
{
    protected string $model;

    protected string $modelName;

    protected array $expectedProperties;

    protected function createWrapper(object $properties, callable $callback)
    {
        Log::notice("Provisioning $this->modelName '$properties->name'");
        foreach ($this->expectedProperties as $prop) {
            if (! isset($properties->$prop)) {
                throw new UnexpectedValueException("Incomplete $modelName definition");
            }
        }
        $item = new $this->model;
        $callback($item);
        $item->save();
    }

    protected function destroyWrapper(array $match, ?callable $callback = null)
    {
        if ($match) {
            $expression = implode(' && ', array_map(fn ($a, $b) => "$a = $b", array_keys($match), array_values($match)));
            Log::notice("Deleting all {$this->modelName}s matching '$expression'");
        } else {
            Log::notice("Deleting all {$this->modelName}s");
        }
        $items = $this->model::lazy();
        foreach ($match as $key => $value) {
            $items = $items->where($key, $value);
        }
        foreach ($items as $item) {
            if ($callback) {
                $callback($item);
            }
            if (! $item->delete()) {
                Log::error("Failed to delete $this->modelName '$item->name'");
            }
        }
    }

    abstract public function create(object $properties);

    // abstract public function read(array $match): object;

    // abstract public function update(array $match, object $properties);

    abstract public function destroy(array $match = []);
}

class ServerProvisioner extends AbstractProvisioner
{
    protected string $model = 'App\Models\Server';

    protected string $modelName = 'server';

    protected array $expectedProperties = ['name', 'description', 'endpoint', 'secret', 'strength', 'status'];

    public function create(object $properties)
    {
        $this->createWrapper($properties, function ($srv) use ($properties) {
            if (! is_int($properties->strength)) {
                throw new UnexpectedValueException('Server strength must be a number');
            }
            $status = "App\Enums\ServerStatus::".strtoupper($properties->status);
            if (! defined($status)) {
                throw new UnexpectedValueException('Invalid server status');
            }
            $srv->name = $properties->name;
            $srv->description = $properties->description;
            $srv->base_url = $properties->endpoint;
            $srv->secret = $properties->secret;
            $srv->strength = $properties->strength;
            // TODO: PHP 8.3 allows the following syntax
            // ServerStatus::{strtoupper($properties->status)}->value;
            $srv->status = constant($status)->value;
        });
    }

    public function destroy(array $match = [])
    {
        $this->destroyWrapper($match, fn (Server $item) => $item->status = ServerStatus::DISABLED);
    }
}

class ServerPoolProvisioner extends AbstractProvisioner
{
    protected string $model = 'App\Models\ServerPool';

    protected string $modelName = 'server pool';

    protected array $expectedProperties = ['name', 'description', 'servers'];

    public function create(object $properties)
    {
        $this->createWrapper($properties, function ($pool) use ($properties) {
            $pool->name = $properties->name;
            $pool->description = $properties->description;
            $pool->save();
            $servers = Server::whereIn('name', $properties->servers)->get();
            $pool->servers()->sync($servers);
        });
    }

    public function destroy(array $match = [])
    {
        $this->destroyWrapper($match);
    }
}

class RoomTypeProvisioner extends AbstractProvisioner
{
    protected string $model = 'App\Models\RoomType';

    protected string $modelName = 'room type';

    protected array $expectedProperties = ['name', 'description', 'color', 'server_pool'];

    public function create(object $properties)
    {
        $this->createWrapper($properties, function ($type) use ($properties) {
            $type->name = $properties->name;
            $type->description = $properties->description;
            $type->color = $properties->color;
            $pool = ServerPool::firstWhere('name', $properties->server_pool);
            if (is_null($pool)) {
                Log::error("Could not find server pool '$properties->serverPool'");

                return;
            }
            $type->serverPool()->associate($pool);
        });
    }

    public function destroy(array $match = [])
    {
        $this->destroyWrapper($match);
    }
}

class ProvisioningService
{
    public ServerProvisioner $server;

    public ServerPoolProvisioner $serverPool;

    public RoomTypeProvisioner $roomType;

    public function __construct()
    {
        $this->server = new ServerProvisioner;
        $this->serverPool = new ServerPoolProvisioner;
        $this->roomType = new RoomTypeProvisioner;
    }
}
