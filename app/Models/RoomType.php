<?php

namespace App\Models;

use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RoomType extends Model
{
    use AddsModelNameTrait, HasFactory;

    protected function casts()
    {
        $casts = [
            'restrict' => 'boolean',
            'max_participants' => 'integer',
            'max_duration' => 'integer',
            'has_access_code_default' => 'boolean',
            'has_access_code_enforced' => 'boolean',
        ];

        foreach (Room::ROOM_SETTINGS_DEFINITION as $setting => $config) {
            $casts[$setting.'_default'] = $config['cast'];
            $casts[$setting.'_enforced'] = 'boolean';
        }

        return $casts;
    }

    protected $fillable = ['name', 'color', 'restrict'];

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }

    /**
     * Roles which can create and have rooms with this type.
     *
     * @return BelongsToMany
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }

    public function serverPool()
    {
        return $this->belongsTo(ServerPool::class);
    }
}
