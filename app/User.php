<?php

namespace App;

use App\Traits\AddsModelNameTrait;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use LdapRecord\Laravel\Auth\AuthenticatesWithLdap;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use Notifiable, AuthenticatesWithLdap, HasApiTokens, HasRoles, AddsModelNameTrait;

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

    public function myRooms()
    {
        return $this->hasMany(Room::class);
    }

    public function sharedRooms()
    {
        return $this->belongsToMany(Room::class)->withPivot('moderator');
    }

    public function guardName()
    {
        // TODO: Change after pull request #21 was merged!
        return $this->getLdapGuid() ? 'api' : 'api_users';
    }
}
