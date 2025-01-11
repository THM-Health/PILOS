<?php

namespace App\Models;

use App\Notifications\PasswordReset;
use App\Settings\RoomSettings;
use App\Traits\AddsModelNameTrait;
use Carbon\Carbon;
use Illuminate\Contracts\Translation\HasLocalePreference;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\HasApiTokens;
use Storage;

class User extends Authenticatable implements HasLocalePreference
{
    use AddsModelNameTrait, HasApiTokens, HasFactory, Notifiable;

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
        'firstname', 'lastname', 'email', 'password', 'external_id', 'guid', 'domain', 'locale', 'bbb_skip_check_audio', 'authenticator',
        'initial_password_set', 'timezone',
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
        'email_verified_at' => 'datetime',
        'bbb_skip_check_audio' => 'boolean',
        'initial_password_set' => 'boolean',
    ];

    protected $appends = ['fullname'];

    // Cached list of all permissions of the user
    protected ?array $permissionsCache = null;

    // Clear the permissionsCache of all users before the next permission check
    // Is set to true on any change by the pivot models that control the permissions of the user (RoleUser, PermissionRole, IncludedPermissionPermission)
    public static $clearPermissionCache = false;

    public function getFullnameAttribute()
    {
        return $this->firstname.' '.$this->lastname;
    }

    public function getLogLabel()
    {
        return $this->fullname.' ('.$this->id.')';
    }

    /**
     * Get public url of the users profile picture
     *
     * @return string|null
     */
    public function getImageUrlAttribute()
    {
        return $this->image != null ? Storage::disk('public')->url($this->image) : null;
    }

    /**
     * Route notifications for the mail channel.
     */
    public function routeNotificationForMail(Notification $notification): array
    {
        return [$this->email => $this->fullname];
    }

    /**
     * Rooms the user is owner of
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function myRooms()
    {
        return $this->hasMany(Room::class);
    }

    /**
     * The user favorites
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function roomFavorites()
    {
        return $this->belongsToMany(Room::class, 'room_favorites');
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
        $globalRoomLimit = app(RoomSettings::class)->limit;

        $role_limits = $this->roles()->pluck('room_limit');
        $role_limits->transform(function ($item, $key) use ($globalRoomLimit) {
            return $item !== null ? $item : $globalRoomLimit;
        });

        // check if any role has unlimited rooms, if yes set to unlimited
        if ($role_limits->contains(-1)) {
            return -1;
        }

        // return highest room limit
        return (int) $role_limits->max();
    }

    /**
     * Check if the users room limit has exceeded
     *
     * @return bool
     */
    public function hasRoomLimitExceeded()
    {
        $roomLimit = $this->room_limit;

        return $roomLimit !== -1 && $this->myRooms()->count() >= $roomLimit;
    }

    /**
     * Rooms the user is member of
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function sharedRooms()
    {
        return $this->belongsToMany(Room::class)->withPivot('role');
    }

    /**
     * Scope a query to only get users that have a firstname like the passed one.
     *
     * @param  Builder  $query  Query that should be scoped
     * @param  string  $firstname  Firstname to search for
     * @return Builder The scoped query
     */
    public function scopeWithFirstName(Builder $query, $firstname)
    {
        return $query->whereLike('firstname', '%'.$firstname.'%');
    }

    /**
     * Scope a query to only get users that are members of a given role.
     *
     * @param  Builder  $query  Query that should be scoped
     * @param  int  $role  Role the user has
     * @return Builder The scoped query
     */
    public function scopeWithRole(Builder $query, $role)
    {
        return $query->join('role_user', 'role_user.user_id', '=', 'users.id')->where('role_user.role_id', $role);
    }

    /**
     * Scope a query to only get users that have a lastname like the passed one.
     *
     * @param  Builder  $query  Query that should be scoped
     * @param  string  $lastname  Lastname to search for
     * @return Builder The scoped query
     */
    public function scopeWithLastName(Builder $query, $lastname)
    {
        return $query->whereLike('lastname', '%'.$lastname.'%');
    }

    /**
     * Scope a query to only get users that have an email like the passed one.
     *
     * @param  Builder  $query  Query that should be scoped
     * @param  string  $email  Email to search for
     * @return Builder The scoped query
     */
    public function scopeWithEmail(Builder $query, $email)
    {
        return $query->whereLike('email', '%'.$email.'%');
    }

    /**
     * Scope a query to only get users that have a name like the passed one.
     *
     * The name gets split up by the whitespaces and each part will be searched
     * in the corresponding name fields.
     *
     * @param  Builder  $query  Query that should be scoped
     * @param  string  $name  Name to search for
     * @return Builder The scoped query
     */
    public function scopeWithName(Builder $query, $name)
    {
        $name = preg_replace('/\s\s+/', ' ', $name);
        $splittedName = explode(' ', $name);

        return $query->where(function (Builder $query) use ($splittedName) {
            foreach ($splittedName as $name) {
                $query->where(function (Builder $query) use ($name) {
                    $query->withFirstName($name)->orWhere->withLastName($name)->orWhere->withEmail($name);
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
        return $this->belongsToMany(Role::class)->withPivot('automatic')->using(RoleUser::class);
    }

    /**
     * Array of unique permission names that are given to the user through the assigned roles and inherited by other permissions.
     *
     * @return string[]
     */
    public function getPermissionsAttribute()
    {
        $permissions = [];

        DB::table('permissions')
            ->join('permission_role', 'permission_role.permission_id', '=', 'permissions.id')
            ->join('role_user', 'permission_role.role_id', '=', 'role_user.role_id')
            ->leftJoin('included_permissions', 'permissions.id', '=', 'included_permissions.permission_id')
            ->leftJoin('permissions as permissions2', 'permissions2.id', '=', 'included_permissions.included_permission_id')
            ->where('role_user.user_id', '=', $this->id)
            ->get(['permissions.name', 'permissions2.name as included_permission_name'])
            ->each(function ($item) use (&$permissions) {
                if ($item->included_permission_name != null) {
                    array_push($permissions, $item->included_permission_name);
                }

                array_push($permissions, $item->name);
            });

        // remove duplicates; array_keys(array_flip( is much faster than array_unique (see https://dev.to/devmount/4-php-tricks-to-boost-script-performance-ol1)
        return array_keys(array_flip($permissions));
    }

    /**
     * Check if user has the given permission
     *
     * @param  string  $permission  Name of a permission
     * @return bool has permission
     */
    public function hasPermission(string $permission)
    {
        // Check if the permission cache is not set or if it should be cleared
        if ($this->permissionsCache == null || self::$clearPermissionCache) {
            // Build permission cache
            $this->permissionsCache = $this->getPermissionsAttribute();

            self::$clearPermissionCache = false;
        }

        // Check if the user has the permission
        return in_array($permission, $this->permissionsCache);
    }

    public function sessions()
    {
        return $this->hasMany(Session::class);
    }

    public function verifyEmails()
    {
        return $this->hasMany(VerifyEmail::class);
    }

    public function preferredLocale()
    {
        return $this->locale;
    }

    /**
     * Send a password reset notification to the user.
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $reset = DB::table('password_resets')
            ->where('email', '=', $this->email)
            ->first();

        $this->notify(new PasswordReset($token, Carbon::parse($reset->created_at)));
    }

    /**
     * @return bool
     */
    public function getSuperuserAttribute()
    {
        return $this->roles->where('superuser', true)->isNotEmpty();
    }
}
