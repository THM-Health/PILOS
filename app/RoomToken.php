<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RoomToken extends Model
{
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
        static::saving(function ($model) {
            if ($model->isDirty()) {
                while (true) {
                    $token = Str::random(100);

                    if (DB::table('room_tokens')->where('token', '=', $token)->doesntExist()) {
                        $model->token = $token;

                        break;
                    }
                }
            }
            Log::debug(var_export($model, true));
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
}
