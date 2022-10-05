<?php

namespace App\Models;

use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\HasApiTokens;
use LdapRecord\Laravel\Auth\AuthenticatesWithLdap;
use Illuminate\Contracts\Translation\HasLocalePreference;
use Storage;

class User extends Authenticatable implements HasLocalePreference
{
    use Notifiable, AuthenticatesWithLdap, HasApiTokens, AddsModelNameTrait, HasFactory;

    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::deleting(function ($model) {
            $model->myRooms->each->delete();
        });
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'firstname', 'lastname', 'email', 'password', 'username', 'guid', 'domain', 'locale', 'bbb_skip_check_audio',
        'initial_password_set', 'timezone'
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password', 'remember_token',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'email_verified_at'    => 'datetime',
        'bbb_skip_check_audio' => 'boolean',
        'initial_password_set' => 'boolean'
    ];

    protected $appends = ['fullname'];

    public function getFullnameAttribute()
    {
        return $this->firstname.' '.$this->lastname;
    }

    /**
     * Get public url of the users profile picture
     * @return string|null
     */
    public function getImageUrlAttribute()
    {
        return $this->image != null ? Storage::disk('public')->url($this->image) : null;
    }

    /**
     * Route notifications for the mail channel.
     *
     * @param  Notification $notification
     * @return array
     */
    public function routeNotificationForMail(Notification $notification): array
    {
        return [$this->email => $this->fullname];
    }

    /**
     * Rooms the user is owner of
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function myRooms()
    {
        return $this->hasMany(Room::class);
    }

    /**
     * Calculation of the room limit for this user, based on groups and global settings
     * Groups have priority over global settings. Use the highest value of all groups or unlimited (-1) of
     * exits in one of the groups
     * If room limit of a group is null, use system default as group limit.
     *
     * @return int limit of rooms of this user: -1: unlimited, 0: zero rooms, 1: one room, 2: two rooms ...
     */
    public function getRoomLimitAttribute()
    {
        $role_limits = $this->roles()->pluck('room_limit');
        $role_limits->transform(function ($item, $key) {
            return $item !== null ? $item : setting('room_limit');
        });

        // check if any role has unlimited rooms, if yes set to unlimited
        if ($role_limits->contains(-1)) {
            return -1;
        }

        // return highest room limit
        return intval($role_limits->max());
    }

    /**
     * Rooms the user is member of
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function sharedRooms()
    {
        return $this->belongsToMany(Room::class)->withPivot('role');
    }

    /**
     * Scope a query to only get users that have a firstname like the passed one.
     *
     * @param  Builder $query     Query that should be scoped
     * @param  String  $firstname Firstname to search for
     * @return Builder The scoped query
     */
    public function scopeWithFirstName(Builder $query, $firstname)
    {
        return $query->where('firstname', 'like', '%' . $firstname . '%');
    }

    /**
     * Scope a query to only get users that are members of a given role.
     *
     * @param  Builder $query Query that should be scoped
     * @param  int     $role  Role the user has
     * @return Builder The scoped query
     */
    public function scopeWithRole(Builder $query, $role)
    {
        return $query->join('role_user', 'role_user.user_id', '=', 'users.id')->where('role_user.role_id', $role);
    }

    /**
     * Scope a query to only get users that have a lastname like the passed one.
     *
     * @param  Builder $query    Query that should be scoped
     * @param  String  $lastname Lastname to search for
     * @return Builder The scoped query
     */
    public function scopeWithLastName(Builder $query, $lastname)
    {
        return $query->where('lastname', 'like', '%' . $lastname . '%');
    }

    /**
     * Scope a query to only get users that have a name like the passed one.
     *
     * The name gets split up by the whitespaces and each part will be searched
     * in the corresponding name fields.
     *
     * @param  Builder $query Query that should be scoped
     * @param  String  $name  Name to search for
     * @return Builder The scoped query
     */
    public function scopeWithName(Builder $query, $name)
    {
        $name         =  preg_replace('/\s\s+/', ' ', $name);
        $splittedName = explode(' ', $name);

        return $query->where(function (Builder $query) use ($splittedName) {
            foreach ($splittedName as $name) {
                $query->where(function (Builder $query) use ($name) {
                    $query->withFirstName($name)->orWhere->withLastName($name);
                });
            }
        });
    }

    /**
     * The roles that are assigned to the user.
     *
     * @return BelongsToMany
     */
    public function roles()
    {
        return $this->belongsToMany('App\Models\Role')->withPivot('automatic')->using('App\Models\RoleUser');
    }

    /**
     * Array of unique permission names that are given to the user through the assigned roles and inherited by other permissions.
     *
     * @return String[]
     */
    public function getPermissionsAttribute()
    {
        return array_reduce($this->roles->all(), function ($permissions, $role) {
            foreach ($role->permissions as $permission) {
                if (!in_array($permission->name, $permissions)) {
                    array_push($permissions, $permission->name);
                    foreach ($permission->includedPermissions as $includedPermission) {
                        if (!in_array($includedPermission->name, $permissions)) {
                            array_push($permissions, $includedPermission->name);
                        }
                    }
                }
            }

            return $permissions;
        }, []);
    }

    /**
     * Check if user has the given permission
     * @param $permission string Name of a permission
     * @return bool has permission
     */
    public function hasPermission($permission)
    {
        return DB::table('permissions')
            ->join('permission_role', 'permission_role.permission_id', '=', 'permissions.id')
            ->join('role_user', 'permission_role.role_id', '=', 'role_user.role_id')
            ->leftJoin('included_permissions', 'permissions.id', '=', 'included_permissions.permission_id')
            ->leftJoin('permissions as permissions2', 'permissions2.id', '=', 'included_permissions.included_permission_id')
            ->where(function ($query) use ($permission) {
                $query->where('permissions.name', '=', $permission)
                    ->orWhere('permissions2.name', '=', $permission);
            })
            ->where('role_user.user_id', '=', $this->id)
            ->exists();
    }

    public function sessions()
    {
        return $this->hasMany(Session::class);
    }

    public function preferredLocale()
    {
        return $this->locale;
    }
}
