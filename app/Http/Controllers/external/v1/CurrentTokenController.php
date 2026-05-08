<?php

declare(strict_types=1);

namespace App\Http\Controllers\external\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\External\CurrentUserResource;

class CurrentTokenController extends Controller
{
    public function show()
    {
        return CurrentUserResource::make(auth()->user());
    }
}
