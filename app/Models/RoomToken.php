<?php

namespace App\Models;

use App\Enums\RoomUserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RoomToken extends Model
{
    use HasFactory;

    protected $casts = [
        'last_usage' => 'datetime',
        'role'       => RoomUserRole::class,
    ];

    /**
     * @var string Override primary key with correct value.
     */
    protected $primaryKey = 'token';

    /**
     * @var string Disable incrementing of primary key.
     */
    public $incrementing = false;

    /**
     * @var string Override primary key type.
     */
    protected $keyType = 'string';

    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::creating(function ($model) {
            while (true) {
                $token = Str::random(100);
                if (DB::table('room_tokens')->where('token', '=', $token)->doesntExist()) {
                    $model->token = $token;

                    break;
                }
            }
        });
    }

    /**
     * Room the token belongs to
     * @return BelongsTo
     */
    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * @return string Name of the key to search for route binding.
     */
    public function getRouteKeyName()
    {
        return 'token';
    }

    /**
     * Full name of the token owner.
     * @return string
     */
    public function getFullnameAttribute()
    {
        return $this->firstname.' '.$this->lastname;
    }

    /**
     * Expire datetime of the token
     * @return null
     */
    public function getExpiresAttribute()
    {
        return setting('room_token_expiration') > -1 ? ($this->last_usage != null ? $this->last_usage->addMinutes(setting('room_token_expiration')) : $this->created_at->addMinutes(setting('room_token_expiration'))) : null;
    }
}
