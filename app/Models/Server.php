<?php

namespace App\Models;

use App\Enums\ServerStatus;
use App\Services\ServerService;
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
             * If status is changed and new status is not online, reset live usage data
             */
            if ($model->status != $model->getOriginal('status')) {
                if ($model->status != ServerStatus::ONLINE) {
                    $model->version = null;
                    $model->participant_count = null;
                    $model->listener_count = null;
                    $model->voice_participant_count = null;
                    $model->video_count = null;
                    $model->meeting_count = null;
                }
                if ($model->status == ServerStatus::OFFLINE) {
                    $serverService = new ServerService($model);
                    $serverService->endMeetings();
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
        return $query->where('name', 'like', '%'.$name.'%');
    }

    public function getLogLabel()
    {
        return $this->name.' ('.$this->id.')';
    }
}
