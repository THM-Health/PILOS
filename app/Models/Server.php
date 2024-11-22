<?php

namespace App\Models;

use App\Enums\ServerHealth;
use App\Enums\ServerStatus;
use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Server extends Model
{
    use AddsModelNameTrait, HasFactory;

    protected $casts = [
        'strength' => 'integer',
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
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::updating(function (self $model) {

            /**
             * If status is changed and new status is disabled, reset live usage data
             */
            if ($model->status != $model->getOriginal('status')) {
                if ($model->status == ServerStatus::DISABLED) {
                    $model->version = null;
                    $model->participant_count = null;
                    $model->listener_count = null;
                    $model->voice_participant_count = null;
                    $model->video_count = null;
                    $model->meeting_count = null;
                }
            }
        });
        static::updated(function (self $model) {
            // Check if server is failing (error count increased or recover count decreased)
            if ($model->error_count > $model->getOriginal('error_count') || $model->recover_count < $model->getOriginal('recover_count')) {
                \Log::error('Server {server} failing', [
                    'server' => $model->getLogLabel(),
                    'error_count' => $model->error_count,
                    'old_error_count' => $model->getOriginal('error_count'),
                ]);
            }

            // Check if server is recovering (recover count increased)
            if ($model->recover_count > $model->getOriginal('recover_count')) {
                \Log::notice('Server {server} recovering', [
                    'server' => $model->getLogLabel(),
                    'recover_count' => $model->recover_count,
                    'old_recover_count' => $model->getOriginal('recover_count'),
                ]);
            }

            // Check if server health changed
            $newHealth = self::calcHealth($model->recover_count, $model->error_count);
            $previousHealth = self::calcHealth($model->getOriginal('recover_count'), $model->getOriginal('error_count'));
            if ($newHealth != $previousHealth) {
                if ($newHealth == ServerHealth::OFFLINE) {
                    \Log::error('Server {server} health changed to offline', [
                        'server' => $model->getLogLabel(),
                        'old_health' => $previousHealth->name,
                    ]);
                }

                if ($newHealth == ServerHealth::UNHEALTHY) {
                    \Log::warning('Server {server} health changed to unhealthy', [
                        'server' => $model->getLogLabel(),
                        'old_health' => $previousHealth->name,
                    ]);
                }

                if ($newHealth == ServerHealth::ONLINE) {
                    \Log::notice('Server {server} health changed to healthy', [
                        'server' => $model->getLogLabel(),
                        'old_health' => $previousHealth->name,
                    ]);
                }
            }
        });
        static::deleting(function (self $model) {
            // Delete Server, only possible if no meetings from this system are running and the server is disabled
            if ($model->status != ServerStatus::DISABLED || $model->meetings()->whereNull('end')->count() != 0) {
                return false;
            }
        });
    }

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
    public function scopeWithName(Builder $query, $name)
    {
        return $query->whereLike('name', '%'.$name.'%');
    }

    public function getLogLabel()
    {
        return $this->name.' ('.$this->id.')';
    }

    public function getHealthAttribute(): ?ServerHealth
    {
        if ($this->status == ServerStatus::DISABLED) {
            return null;
        }

        return self::calcHealth($this->recover_count, $this->error_count);
    }

    private static function calcHealth(int $recover_count, int $error_count): ServerHealth
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
