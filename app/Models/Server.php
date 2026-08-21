<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ServerConnectionStatus;
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
        'connection_status_always_online' => 'boolean',
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

    public function getConnectionStatusAttribute(): ?ServerConnectionStatus
    {
        // No connection status available for disabled servers
        if ($this->status == ServerStatus::DISABLED) {
            return null;
        }

        // Always return online if connection_status_always_online
        if ($this->connection_status_always_online) {
            return ServerConnectionStatus::ONLINE;
        }

        return self::calculateConnectionStatus($this->recover_count, $this->error_count);
    }

    public static function calculateConnectionStatus(int $recover_count, int $error_count): ServerConnectionStatus
    {
        if ($recover_count >= config('bigbluebutton.server_online_threshold')) {
            return ServerConnectionStatus::ONLINE;
        }
        if ($error_count >= config('bigbluebutton.server_offline_threshold')) {
            return ServerConnectionStatus::OFFLINE;
        }

        return ServerConnectionStatus::FAULTY;
    }
}
