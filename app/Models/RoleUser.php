<?php

namespace App\Models;

use App\Observers\RoleUserObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Relations\Pivot;

#[ObservedBy([RoleUserObserver::class])]
class RoleUser extends Pivot
{
    protected $casts = ['automatic' => 'boolean'];
}
