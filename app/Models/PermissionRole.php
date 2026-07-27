<?php

declare(strict_types=1);

namespace App\Models;

use App\Observers\PermissionRoleObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Relations\Pivot;

#[ObservedBy([PermissionRoleObserver::class])]
class PermissionRole extends Pivot {}
