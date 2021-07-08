<?php

namespace App\Http\Controllers\auth;

use Cache;
use Illuminate\Support\Facades\Log;

class SoapServerHandler
{
    /// This function does the actual logout
    public function logoutNotification($SessionID)
    {
        $session = Cache::get('shib-session-'.$SessionID);
        session()->setId($session);
        session()->invalidate();
        Log::info('logout '.$session);
    }
}
