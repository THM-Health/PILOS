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
use Illuminate\Support\Str;
use Log;
use ReflectionClass;
use UnexpectedValueException;
use ValueError;

abstract class AbstractProvisioner
{
    private string $model;

    private string $modelName;

    private array $expectedProperties;

    public function __construct(string $model, array $expectedProperties)
    {
        $name = (new ReflectionClass($model))->getShortname();
        $this->modelName = Str::of($name)->snake()->replace('_', ' ')->value();
        $this->model = $model;
        $this->expectedProperties = $expectedProperties;
    }

    protected function instanceName(object $properties)
    {
        return $properties->name;
    }

    protected function createWrapper(object $properties, callable $callback)
    {
        Log::notice("Provisioning {$this->modelName} '{$this->instanceName($properties)}'");
        $validator = Validator::make((array) $properties, $this->expectedProperties);
        if ($validator->fails()) {
            throw new UnexpectedValueException("Invalid {$this->modelName} definition: {$validator->errors()}");
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
        $query = $this->model::query();
        foreach ($match as $key => $value) {
            $query = $query->where($key, $value);
        }
        $query->get()->each(function (object $item) use ($callback) {
            if ($callback) {
                $callback($item);
            }
            if (! $item->delete()) {
                Log::error("Failed to delete {$this->modelName} '{$item->getLogLabel()}'");
            }
        });
    }

    abstract public function create(object $properties);

    // abstract public function read(array $match): object;

    // abstract public function update(array $match, object $properties);

    abstract public function destroy(array $match = []);
}

class ServerProvisioner extends AbstractProvisioner
{
    public function __construct()
    {
        $expectedProperties = [
            'name' => 'required|string|unique:servers,name',
            'description' => 'required|string',
            'endpoint' => 'required|string',
            'secret' => 'required|string',
            'strength' => 'required|integer|min:1|max:10',
            'status' => 'required|in:disabled,enabled',
        ];
        parent::__construct(Server::class, $expectedProperties);
    }

    public function create(object $properties)
    {
        $this->createWrapper($properties, function ($srv) use ($properties) {
            $status = ServerStatus::{strtoupper($properties->status)};
            $srv->name = $properties->name;
            $srv->description = $properties->description;
            $srv->base_url = $properties->endpoint;
            $srv->secret = $properties->secret;
            $srv->strength = $properties->strength;
            $srv->status = $status;
        });
    }

    public function destroy(array $match = [])
    {
        $this->destroyWrapper($match, fn (Server $item) => $item->status = ServerStatus::DISABLED);
    }
}

class ServerPoolProvisioner extends AbstractProvisioner
{
    public function __construct()
    {
        $expectedProperties = [
            'name' => 'required|string|unique:server_pools,name',
            'description' => 'required|string',
            'servers' => 'required|list|distinct|exists:servers,name',
            'servers.*' => 'string',
        ];
        parent::__construct(ServerPool::class, $expectedProperties);
    }

    public function create(object $properties)
    {
        $this->createWrapper($properties, function ($pool) use ($properties) {
            $servers = Server::whereIn('name', $properties->servers)->get();
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
    public function __construct()
    {
        $expectedProperties = [
            'name' => 'required|string|unique:room_types,name',
            'description' => 'required|string',
            'color' => 'required|string',
            'server_pool' => 'required|string|exists:server_pools,name',
        ];
        parent::__construct(RoomType::class, $expectedProperties);
    }

    public function create(object $properties)
    {
        $this->createWrapper($properties, function ($type) use ($properties) {
            $type->name = $properties->name;
            $type->description = $properties->description;
            $type->color = $properties->color;
            $pool = ServerPool::firstWhere('name', $properties->server_pool);
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
    public function __construct()
    {
        $expectedProperties = [
            'name' => 'required|string',
            'permissions' => 'required|array:rooms,meetings,settings,users,roles,roomTypes,servers,serverPools',
            'permissions.rooms' => 'list',
            'permissions.rooms.*' => 'string',
            'permissions.meetings' => 'list',
            'permissions.meetings.*' => 'string',
            'permissions.settings' => 'list',
            'permissions.settings.*' => 'string',
            'permissions.users' => 'list',
            'permissions.users.*' => 'string',
            'permissions.roles' => 'list',
            'permissions.roles.*' => 'string',
            'permissions.roomTypes' => 'list',
            'permissions.roomTypes.*' => 'string',
            'permissions.servers' => 'list',
            'permissions.servers.*' => 'string',
            'permissions.serverPools' => 'list',
            'permissions.serverPools.*' => 'string',
        ];
        parent::__construct(Role::class, $expectedProperties);
    }

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
    public function __construct()
    {
        $expectedProperties = [
            'firstname' => 'required|string',
            'lastname' => 'required|string',
            'email' => 'required|string',
            'password' => 'required|string',
            'authenticator' => 'required|string',
            'roles' => 'required|list|exists:roles,name',
            'roles.*' => 'string',
            'locale' => 'required|string',
            'timezone' => 'required|string',
        ];
        parent::__construct(User::class, $expectedProperties);
    }

    protected function instanceName(object $properties)
    {
        return "$properties->firstname $properties->lastname";
    }

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
        'general.name' => 'string',
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
