<?php

namespace App\Auth\Shibboleth;

use App\Models\SessionData;

class SoapServerHandler
{
    /**
     * Handle logout notification from Shibboleth (back channel logout)
     */
    public function logoutNotification($SessionID)
    {
        // Delete all sessions with the given shibboleth session id
        $hashShibbolethSessionId = app(ShibbolethProvider::class)->hashShibbolethSessionId($SessionID);
        $lookupSessions          = SessionData::where('key', 'shibboleth_session_id')->where('value', $hashShibbolethSessionId)->get();
        foreach ($lookupSessions as $lookupSession) {
            $lookupSession->session()->delete();
        }
    }
}
