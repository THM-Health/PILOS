<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\RoomUserRole;
use App\Enums\TimePeriod;
use App\Observers\RoomPersonalizedLinkObserver;
use App\Settings\RoomSettings;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ObservedBy([RoomPersonalizedLinkObserver::class])]
class RoomPersonalizedLink extends Model
{
    use HasFactory;

    protected $casts = [
        'last_usage' => 'datetime',
        'role' => RoomUserRole::class,
    ];

    /**
     * Room the link belongs to
     *
     * @return BelongsTo
     */
    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Full name of the links owner.
     *
     * @return string
     */
    public function getFullnameAttribute()
    {
        return $this->firstname.' '.$this->lastname;
    }

    /**
     * Expire datetime of the link
     *
     * @return null
     */
    public function getExpiresAttribute()
    {
        $linkExpiration = app(RoomSettings::class)->personalized_link_expiration;

        return $linkExpiration != TimePeriod::UNLIMITED ? ($this->last_usage != null ? $this->last_usage->addDays($linkExpiration->value) : $this->created_at->addDays($linkExpiration->value)) : null;
    }
}
