<?php

namespace App\Services;

use App\Enums\ServerStatus;
use App\Enums\TimePeriod;
use App\Http\Requests\UpdateSettings;
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
use Illuminate\Validation\Rule;
use ReflectionClass;
use UnexpectedValueException;

use function Laravel\Prompts\error;
use function Laravel\Prompts\info;

abstract class AbstractProvisioner
{
    private string $modelName;

    public function __construct(private string $model, private array $expectedProperties)
    {
        $name = (new ReflectionClass($model))->getShortname();
        $this->modelName = Str::of($name)->snake()->replace('_', ' ')->value();
    }

    protected function instanceName(object $properties)
    {
        return $properties->name;
    }

    protected function createWrapper(object $properties, callable $callback)
    {
        info("Provisioning {$this->modelName} '{$this->instanceName($properties)}'");
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
            info("Deleting all {$this->modelName}s matching '$expression'");
        } else {
            info("Deleting all {$this->modelName}s");
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
                error("Failed to delete {$this->modelName} '{$item->getLogLabel()}'");
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
            'servers' => 'required|list',
            'servers.*' => 'string|distinct|exists:servers,name',
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
            'color' => 'required|string|hex_color',
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
            'roles' => 'required|list',
            'roles.*' => 'string|distinct|exists:roles,name',
            'locale' => ['required', 'string', Rule::in(array_keys(config('app.enabled_locales')))],
            'timezone' => ['required', 'string', Rule::in(timezone_identifiers_list())],
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
    public function __construct()
    {
        $this->settings = [
            'general' => app(GeneralSettings::class),
            'room' => app(RoomSettings::class),
            'user' => app(UserSettings::class),
            'recording' => app(RecordingSettings::class),
        ];
        $this->expectedProperties = [
            'general' => 'array:name,pagination_page_size,default_timezone,help_url,legal_notice_url,privacy_policy_url,toast_lifetime,no_welcome_page',
            'room' => 'array:limit,token_expiration,auto_delete_inactive_period,auto_delete_never_used_period,auto_delete_deadline_period,file_terms_of_use',
            'user' => 'array:password_change_allowed',
            'recording' => 'array:server_usage_enabled,server_usage_retention_period,meeting_usage_enabled,meeting_usage_retention_period,attendance_retention_period,recording_retention_period',
        ];
        foreach ((new UpdateSettings)->rules() as $property => $validations) {
            foreach (['banner', 'bbb', 'theme'] as $section) {
                if (str_starts_with($property, $section)) {
                    continue 2;
                }
            }
            $property = Str::replaceFirst('_', '.', $property);
            $validations = array_filter($validations, fn ($v) => $v != 'required');
            $this->expectedProperties[$property] = $validations;
        }
    }

    public function set(object $settings)
    {
        $validator = Validator::make((array) $settings, $this->expectedProperties);
        if ($validator->fails()) {
            throw new UnexpectedValueException("Invalid settings definition: {$validator->errors()}");
        }
        foreach (get_object_vars($settings) as $sect => $items) {
            $section = $this->settings[$sect];
            foreach ($items as $name => $value) {
                info("Provisioning setting '$sect.$name'");
                if ($section->{$name} instanceof TimePeriod) {
                    $value = TimePeriod::from($value);
                }
                $section->{$name} = $value;
            }
            info("Saving $sect settings");
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
