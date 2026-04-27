<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VerifyEmail extends Model
{
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
