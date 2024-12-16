<?php

namespace App\Services;

use App\Enums\ServerStatus;
use App\Enums\TimePeriod;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoomType;
use App\Models\Server;
use App\Models\ServerPool;
use App\Models\User;
use App\Settings\GeneralSettings;
use App\Settings\RecordingSettings;
use App\Settings\RoomSettings;
use App\Settings\UserSettings;
use Illuminate\Database\RecordsNotFoundException;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Log;
use ReflectionClass;
use UnexpectedValueException;
use ValueError;

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
        $name = $properties->name ?? "$properties->firstname $properties->lastname";
        Log::notice("Provisioning {$this->modelName()} '$name'");
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
                $name = $item->name ?? "$item->firstname $item->lastname";
                Log::error("Failed to delete {$this->modelName()} '$name'");
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
            $servers = Server::whereIn('name', $properties->servers)->get();
            if (count($properties->servers) != count($servers)) {
                $message = "Could not find specified server(s) for pool '{$properties->name}'";
                Log::error($message);
                throw new RecordsNotFoundException($message);
            }
            $pool->name = $properties->name;
            $pool->description = $properties->description;
            $pool->save();
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
                $message = "Could not find server pool '$properties->server_pool'";
                Log::error($message);
                throw new RecordsNotFoundException($message);
            }
            $type->serverPool()->associate($pool);
        });
    }

    public function destroy(array $match = [])
    {
        $this->destroyWrapper($match);
    }
}

class RoleProvisioner extends AbstractProvisioner
{
    protected string $model = Role::class;

    protected array $expectedProperties = [
        'name' => 'required|string',
        'permissions' => 'required|array:rooms,meetings,settings,users,roles,roomTypes,servers,serverPools',
        'permissions.rooms' => 'required|list',
        'permissions.meetings' => 'required|list',
        'permissions.settings' => 'required|list',
        'permissions.users' => 'required|list',
        'permissions.roles' => 'required|list',
        'permissions.roomTypes' => 'required|list',
        'permissions.servers' => 'required|list',
        'permissions.serverPools' => 'required|list',
    ];

    public function create(object $properties)
    {
        $this->createWrapper($properties, function ($role) use ($properties) {
            foreach ($properties->permissions as $group => $perms) {
                foreach ($perms as $item) {
                    $permName = "$group.$item";
                    $perm = Permission::firstWhere('name', $permName);
                    if (is_null($perm)) {
                        throw new RecordsNotFoundException("Could not find permission with name '$permName'");
                    }
                    $permissions[] = $perm->id;
                }
            }
            $role->name = $properties->name;
            $role->save();
            $role->permissions()->sync($permissions);
        });
    }

    public function destroy(array $match = [])
    {
        $this->destroyWrapper($match);
    }
}

class UserProvisioner extends AbstractProvisioner
{
    protected string $model = User::class;

    protected array $expectedProperties = [
        'firstname' => 'required|string',
        'lastname' => 'required|string',
        'email' => 'required|string',
        'password' => 'required|string',
        'authenticator' => 'required|string',
        'roles' => 'required|list',
        'roles.*' => 'string',
        'locale' => 'required|string',
        'timezone' => 'required|string',
    ];

    public function create(object $properties)
    {
        $this->createWrapper($properties, function ($user) use ($properties) {
            $roles = Role::whereIn('name', $properties->roles)->get();
            if (count($properties->roles) != count($roles)) {
                $message = "Could not find specified role(s) for user '$properties->firstname $properties->lastname'";
                Log::error($message);
                throw new RecordsNotFoundException($message);
            }
            $user->firstname = $properties->firstname;
            $user->lastname = $properties->lastname;
            $user->email = $properties->email;
            $user->password = \Hash::make($properties->password);
            $user->authenticator = $properties->authenticator;
            $user->locale = $properties->locale;
            $user->timezone = $properties->timezone;
            $user->save();
            $user->roles()->sync($roles);
        });
    }

    public function destroy(array $match = [])
    {
        $this->destroyWrapper($match);
    }
}

class SettingsProvisioner
{
    public static array $expectedProperties = [
        'general' => 'array:name,pagination_page_size,default_timezone,help_url,legal_notice_url,privacy_policy_url,toast_lifetime,no_welcome_page',
        'general.pagination_page_size' => 'integer',
        'general.default_timezone' => 'string',
        'general.help_url' => 'string',
        'general.legal_notice_url' => 'string',
        'general.privacy_policy_url' => 'string',
        'general.toast_lifetime' => 'integer',
        'general.no_welcome_page' => 'boolean',
        'room' => 'array:limit,token_expiration,auto_delete_inactive_period,auto_delete_never_used_period,auto_delete_deadline_period,file_terms_of_use',
        'room.limit' => 'integer',
        'room.token_expiration' => 'integer',
        'room.auto_delete_inactive_period' => 'integer',
        'room.auto_delete_never_used_period' => 'integer',
        'room.auto_delete_deadline_period' => 'integer',
        'room.file_terms_of_use' => 'string',
        'user' => 'array:password_change_allowed',
        'user.password_change_allowed' => 'boolean',
        'recording' => 'array:server_usage_enabled,server_usage_retention_period,meeting_usage_enabled,meeting_usage_retention_period,attendance_retention_period,recording_retention_period',
        'recording.server_usage_enabled' => 'boolean',
        'recording.server_usage_retention_period' => 'integer',
        'recording.meeting_usage_enabled' => 'boolean',
        'recording.meeting_usage_retention_period' => 'integer',
        'recording.attendance_retention_period' => 'integer',
        'recording.recording_retention_period' => 'integer',
    ];

    public function __construct()
    {
        $this->settings = [
            'general' => app(GeneralSettings::class),
            'room' => app(RoomSettings::class),
            'user' => app(UserSettings::class),
            'recording' => app(RecordingSettings::class),
        ];
    }

    public function set(object $settings)
    {
        $validator = Validator::make((array) $settings, self::$expectedProperties);
        if ($validator->fails()) {
            throw new UnexpectedValueException('Invalid settings definition');
        }
        foreach (get_object_vars($settings) as $sect => $items) {
            $section = $this->settings[$sect];
            foreach ($items as $name => $value) {
                Log::notice("Provisioning setting '$sect.$name'");
                if ($section->{$name} instanceof TimePeriod) {
                    try {
                        $value = TimePeriod::from($value);
                    } catch (ValueError) {
                        throw new UnexpectedValueException("Invalid time period '$value'");
                    }
                }
                $section->{$name} = $value;
            }
            Log::notice("Saving $sect settings");
            $section->save();
        }
    }
}

class ProvisioningService
{
    public ServerProvisioner $server;

    public ServerPoolProvisioner $serverPool;

    public RoomTypeProvisioner $roomType;

    public RoleProvisioner $role;

    public UserProvisioner $user;

    public SettingsProvisioner $settings;

    public function __construct()
    {
        $this->server = new ServerProvisioner;
        $this->serverPool = new ServerPoolProvisioner;
        $this->roomType = new RoomTypeProvisioner;
        $this->role = new RoleProvisioner;
        $this->user = new UserProvisioner;
        $this->settings = new SettingsProvisioner;
    }
}
