<?php

namespace App;

use App\Enums\ServerStatus;
use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ServerPool extends Model
{
    use AddsModelNameTrait;

    protected $fillable = ['name','description'];

    const VIDEO_WEIGHT       = 3;
    const AUDIO_WEIGHT       = 2;
    const PARTICIPANT_WEIGHT = 1;

    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::deleting(function (self $model) {
            // Delete Server, only possible if no room types associated
            if ($model->roomTypes()->count() != 0) {
                return false;
            }
        });
    }

    /**
     * Servers that are port of this server pools
     * @return BelongsToMany
     */
    public function servers(): BelongsToMany
    {
        return $this->belongsToMany(Server::class);
    }

    public function roomTypes()
    {
        return $this->hasMany(RoomType::class);
    }

    /**
     * Scope a query to only get server pools that have a name like the passed one.
     *
     * @param  Builder $query Query that should be scoped
     * @param  String  $name  Name to search for
     * @return Builder The scoped query
     */
    public function scopeWithName(Builder $query, $name)
    {
        return $query->where('name', 'like', '%' . $name . '%');
    }

    /**
     * Find server in the pool with the lowest usage
     * @return Server|null
     */
    public function lowestUsage(): ?Server
    {
        return $this->servers()->where('status', ServerStatus::ONLINE)
            // Experimental
            // Have video factor 3, audio factor 2 and just listening factor 1
            ->orderByRaw('((video_count*'.self::VIDEO_WEIGHT.' + voice_participant_count*'.self::AUDIO_WEIGHT.' + (participant_count-voice_participant_count) * '.self::PARTICIPANT_WEIGHT.')/strength) ASC')
            ->first();
    }
}
