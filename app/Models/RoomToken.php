<?php

namespace App\Models;

use App\Enums\RoomUserRole;
use App\Enums\TimePeriod;
use App\Settings\RoomSettings;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RoomToken extends Model
{
    use HasFactory;

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
    #[\Override]
    protected static function booted()
    {
        static::creating(function ($model): void {
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
     *
     * @return BelongsTo
     */
    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * @return string Name of the key to search for route binding.
     */
    #[\Override]
    public function getRouteKeyName()
    {
        return 'token';
    }

    /**
     * Full name of the token owner.
     *
     * @return string
     */
    protected function fullname(): Attribute
    {
        return Attribute::make(get: fn () => $this->firstname.' '.$this->lastname);
    }

    /**
     * Expire datetime of the token
     *
     * @return null
     */
    protected function expires(): Attribute
    {
        return Attribute::make(get: function () {
            $tokenExpiration = app(RoomSettings::class)->token_expiration;

            return $tokenExpiration != TimePeriod::UNLIMITED ? ($this->last_usage != null ? $this->last_usage->addDays($tokenExpiration->value) : $this->created_at->addDays($tokenExpiration->value)) : null;
        });
    }

    protected function casts(): array
    {
        return [
            'last_usage' => 'datetime',
            'role' => RoomUserRole::class,
        ];
    }
}
