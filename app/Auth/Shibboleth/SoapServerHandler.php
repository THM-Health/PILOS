<?php

namespace App\Auth\Shibboleth;

use App\Models\SessionData;

class SoapServerHandler
{
    public function logoutNotification($SessionID)
    {
        $lookupSessions = SessionData::where('key', 'shibboleth_session_id')->where('value', $SessionID)->get();
        foreach ($lookupSessions as $lookupSession) {
            $lookupSession->session()->delete();
        }
    }
}
