<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ServerHealth;
use App\Enums\ServerStatus;
use App\Observers\ServerObserver;
use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[ObservedBy([ServerObserver::class])]
class Server extends Model
{
    use AddsModelNameTrait, HasFactory;

    protected $casts = [
        'strength' => 'integer',
        'health_check_enabled' => 'boolean',
        'status' => ServerStatus::class,
        'participant_count' => 'integer',
        'listener_count' => 'integer',
        'voice_participant_count' => 'integer',
        'video_count' => 'integer',
        'meeting_count' => 'integer',
        'error_count' => 'integer',
        'recover_count' => 'integer',
        'load' => 'integer',
    ];

    /**
     * Meetings that (have) run on this server
     *
     * @return HasMany
     */
    public function meetings()
    {
        return $this->hasMany(Meeting::class);
    }

    /**
     * Server pools the server is part of
     */
    public function pools(): BelongsToMany
    {
        return $this->belongsToMany(ServerPool::class);
    }

    /**
     * Statistical data of this server
     *
     * @return HasMany
     */
    public function stats()
    {
        return $this->hasMany(ServerStat::class);
    }

    /**
     * Scope a query to only get servers that have a name like the passed one.
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

    public function getHealthAttribute(): ?ServerHealth
    {
        if ($this->status == ServerStatus::DISABLED || ! $this->health_check_enabled) {
            return null;
        }

        return self::calcHealth($this->recover_count, $this->error_count);
    }

    public static function calcHealth(int $recover_count, int $error_count): ServerHealth
    {
        if ($recover_count >= config('bigbluebutton.server_online_threshold')) {
            return ServerHealth::ONLINE;
        }
        if ($error_count >= config('bigbluebutton.server_offline_threshold')) {
            return ServerHealth::OFFLINE;
        }

        return ServerHealth::UNHEALTHY;
    }
}
