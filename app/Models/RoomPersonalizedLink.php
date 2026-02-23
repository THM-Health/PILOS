<?php

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
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Full name of the links owner.
     */
    public function getFullnameAttribute(): string
    {
        return $this->firstname.' '.$this->lastname;
    }

    /**
     * Expire datetime of the link
     */
    public function getExpiresAttribute(): ?\Illuminate\Support\Carbon
    {
        $linkExpiration = app(RoomSettings::class)->personalized_link_expiration;

        return $linkExpiration != TimePeriod::UNLIMITED ? ($this->last_usage != null ? $this->last_usage->addDays($linkExpiration->value) : $this->created_at->addDays($linkExpiration->value)) : null;
    }
}
