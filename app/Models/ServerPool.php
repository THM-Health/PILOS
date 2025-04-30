<?php

namespace App\Models;

use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServerPool extends Model
{
    use AddsModelNameTrait, HasFactory;

    protected $fillable = ['name', 'description'];

    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    #[\Override]
    protected static function booted()
    {
        static::deleting(function (self $model) {
            // Delete server pool only possible if no room types associated
            if ($model->roomTypes()->count() != 0) {
                return false;
            }
        });
    }

    /**
     * Servers that are port of this server pool
     */
    public function servers(): BelongsToMany
    {
        return $this->belongsToMany(Server::class);
    }

    /**
     * RoomTypes that are using this server pool
     *
     * @return HasMany
     */
    public function roomTypes()
    {
        return $this->hasMany(RoomType::class);
    }

    /**
     * Scope a query to only get server pools that have a name like the passed one.
     *
     * @param  Builder  $query  Query that should be scoped
     * @param  string  $name  Name to search for
     */
    #[Scope]
    protected function withName(Builder $query, $name)
    {
        $query->whereLike('name', '%'.$name.'%');
    }

    public function getLogLabel()
    {
        return $this->name.' ('.$this->id.')';
    }
}
