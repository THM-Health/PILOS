<?php

namespace App;

use Illuminate\Database\Eloquent\Builder;
use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use LdapRecord\Laravel\Auth\AuthenticatesWithLdap;

class User extends Authenticatable
{
    use Notifiable, AuthenticatesWithLdap, HasApiTokens, AddsModelNameTrait;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'firstname', 'lastname', 'email', 'password', 'username', 'guid', 'domain', 'locale'
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
    ];

    protected $appends = ['fullname'];

    public function getFullnameAttribute()
    {
        return $this->firstname.' '.$this->lastname;
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
        return $this->belongsToMany('App\Role');
    }

    /**
     * Array of unique permission names that are given to the user through the assigned roles.
     *
     * @return String[]
     */
    public function getPermissionsAttribute()
    {
        return array_reduce($this->roles->all(), function ($permissions, $role) {
            foreach ($role->permissions as $permission) {
                if (!in_array($permission->name, $permissions)) {
                    array_push($permissions, $permission->name);
                }
            }

            return $permissions;
        }, []);
    }
}
