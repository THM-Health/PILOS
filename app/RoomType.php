<?php

namespace App;

use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class RoomType extends Model
{
    use AddsModelNameTrait;

    protected $fillable = ['short','description','color','default'];

    protected $casts = [
        'default'   => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        // Make sure only one room type can be default
        static::saving(function ($roomType) {
            // Remove any other defaults
            if ($roomType->default == true) {
                self::where('default', true)->update(['default' => false]);

                return;
            }
            // If no default exits, set default
            if (self::where('default', true)->doesntExist()) {
                $roomType->default = true;

                return;
            }

            // If the room exits and is default, prevent from changing default
            if ($roomType->exists && $roomType->default == false && self::where('default', true)->where('id', $roomType->id)->exists()) {
                $roomType->default = true;
            }
        });

        // On delete, find a new default if current is deleted
        static::deleting(function ($roomType) {
            if ($roomType->default == true) {
                $room = self::first();
                if ($room != null) {
                    $room->default = true;
                    $room->save();
                }
            }
        });
    }

    /**
     * Scope a query to only get the default room
     *
     * @param  Builder $query Query that should be scoped
     * @return Builder The scoped query
     */
    public function scopeDefault(Builder $query)
    {
        return $query->where('default', true)->first();
    }

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }
}
