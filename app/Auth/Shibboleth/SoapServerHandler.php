<?php

namespace App\Auth\Shibboleth;

use App\Models\SessionData;

class SoapServerHandler
{
    public function logoutNotification($SessionID)
    {
        $hashShibbolethSessionId = app(ShibbolethProvider::class)->hashShibbolethSessionId($SessionID);
        $lookupSessions          = SessionData::where('key', 'shibboleth_session_id')->where('value', $hashShibbolethSessionId)->get();
        foreach ($lookupSessions as $lookupSession) {
            $lookupSession->session()->delete();
        }
    }
}
