<?php

declare(strict_types=1);

namespace App\Models;

use App\Observers\ServerPoolObserver;
use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[ObservedBy([ServerPoolObserver::class])]
class ServerPool extends Model
{
    use AddsModelNameTrait, HasFactory;

    protected $fillable = ['name', 'description'];

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
     * @return Builder The scoped query
     */
    public function scopeWithName(Builder $query, string $name)
    {
        return $query->whereLike('name', '%'.$name.'%');
    }

    public function getLogLabel()
    {
        return $this->name.' ('.$this->id.')';
    }
}
