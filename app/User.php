<?php

namespace App;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use LdapRecord\Laravel\Auth\AuthenticatesWithLdap;

class User extends Authenticatable
{
    use Notifiable, AuthenticatesWithLdap, HasApiTokens;

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

    public function scopeWithFirstName(Builder $query, $firstname)
    {
        return $query->where('firstname', 'like', '%' . $firstname . '%');
    }

    public function scopeWithLastName(Builder $query, $lastname)
    {
        return $query->where('lastname', 'like', '%' . $lastname . '%');
    }

    public function scopeWithName(Builder $query, $name)
    {
        $name         =  preg_replace('/\s\s+/', ' ', $name);
        $splittedName = explode(' ', $name);

        foreach ($splittedName as $name) {
            $query->where(function (Builder $query) use ($name) {
                $query->withFirstName($name)->orWhere->withLastName($name);
            });
        }
    }
}
