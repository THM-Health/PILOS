<?php

declare(strict_types=1);

namespace App\Models;

use App\Observers\IncludedPermissionPermissionObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Relations\Pivot;

#[ObservedBy([IncludedPermissionPermissionObserver::class])]
class IncludedPermissionPermission extends Pivot
{
    protected $table = 'included_permissions';
}
