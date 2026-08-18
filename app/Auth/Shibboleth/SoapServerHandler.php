<?php

declare(strict_types=1);

namespace App\Auth\Shibboleth;

use App\Models\SessionData;
use Illuminate\Support\Facades\Log;

class SoapServerHandler
{
    /**
     * Handle logout notification from Shibboleth (back channel logout)
     */
    public function logoutNotification($SessionID)
    {
        // Delete all sessions with the given shibboleth session id
        $hashShibbolethSessionId = app(ShibbolethProvider::class)->hashShibbolethSessionId($SessionID);
        $lookupSessions = SessionData::where('key', 'shibboleth_session_id')->where('value', $hashShibbolethSessionId)->get();
        foreach ($lookupSessions as $lookupSession) {
            $user = $lookupSession->session->user;
            if ($user) {
                Log::info('Deleting session of user {user} via Shibboleth back-channel logout', ['user' => $user->getLogLabel(), 'type' => 'shibboleth']);
            }
            $lookupSession->session()->delete();
        }
    }
}
