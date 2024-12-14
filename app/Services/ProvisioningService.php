<?php

namespace App\Services;

use App\Enums\ServerStatus;
use App\Models\RoomType;
use App\Models\Server;
use App\Models\ServerPool;
use Illuminate\Database\RecordsNotFoundException;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Log;
use ReflectionClass;
use UnexpectedValueException;

abstract class AbstractProvisioner
{
    protected string $model;

    protected array $expectedProperties;

    protected function modelName()
    {
        $name = (new ReflectionClass($this->model))->getShortname();
        $name = preg_replace_callback('/[A-Z]/', fn ($match) => ' '.strtolower($match[0]), $name);

        return ltrim($name);
    }

    protected function createWrapper(object $properties, callable $callback)
    {
        Log::notice("Provisioning {$this->modelName()} '$properties->name'");
        $validator = Validator::make((array) $properties, $this->expectedProperties);
        if ($validator->fails()) {
            throw new UnexpectedValueException("Invalid {$this->modelName()} definition");
        }
        $item = new $this->model;
        $callback($item);
        $item->save();
    }

    protected function destroyWrapper(array $match, ?callable $callback = null)
    {
        if ($match) {
            $expression = implode(' && ', array_map(fn ($a, $b) => "$a = $b", array_keys($match), array_values($match)));
            Log::notice("Deleting all {$this->modelName()}s matching '$expression'");
        } else {
            Log::notice("Deleting all {$this->modelName()}s");
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
                Log::error("Failed to delete {$this->modelName()} '$item->name'");
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
    protected string $model = Server::class;

    protected array $expectedProperties = [
        'name' => 'required|string',
        'description' => 'required|string',
        'endpoint' => 'required|string',
        'secret' => 'required|string',
        'strength' => 'required|integer|min:1|max:10',
        // TODO: Make something like this work
        // 'status' => [Rule::required, Rule::enum(ServerStatus::class)->except(ServerStatus::DRAINING)],
        'status' => 'required|string',
    ];

    public function create(object $properties)
    {
        $this->createWrapper($properties, function ($srv) use ($properties) {
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
    protected string $model = ServerPool::class;

    protected array $expectedProperties = [
        'name' => 'required|string',
        'description' => 'required|string',
        'servers' => 'required|list',
    ];

    public function create(object $properties)
    {
        $this->createWrapper($properties, function ($pool) use ($properties) {
            $pool->name = $properties->name;
            $pool->description = $properties->description;
            $pool->save();
            $servers = Server::whereIn('name', $properties->servers)->get();
            if (count($properties->servers) != count($servers)) {
                $message = "Could not find specified server(s) for pool '{$pool->name}'";
                Log::error($message);
                throw new RecordsNotFoundException($message);
            }
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
    protected string $model = RoomType::class;

    protected array $expectedProperties = [
        'name' => 'required|string',
        'description' => 'required|string',
        'color' => 'required|string',
        'server_pool' => 'required|string',
    ];

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
