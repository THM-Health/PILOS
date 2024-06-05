<?php

namespace App\Plugins\Defaults;

use App\Plugins\Contracts\OpenCastRecordingPluginContract;

class OpenCastRecordingPlugin implements OpenCastRecordingPluginContract
{
    public function getMetadata(string $meetingId, string $roomId, string $roomName, string $ownerName, string $ownerEmail, string $ownerAuthenticator, string $ownerExternalId): array
    {
        $username = $ownerExternalId;

        return [
            'opencast-dc-title' => now()->format('Y-m-d').' - '.$roomName,
            'opencast-dc-creator' => $ownerName,
            'opencast-dc-created' => now()->toIso8601ZuluString(),
            'opencast-dc-language' => config('app.locale'),
            'opencast-dc-rightsHolder' => $ownerName,
            'opencast-dc-isPartOf' => $roomId,
            'opencast-acl-user-id' => $username,
            'opencast-series-acl-user-id' => $username,
            'opencast-series-dc-title' => $roomName,
            'opencast-series-dc-creator' => $ownerName,
            'opencast-series-dc-rightsholder' => $ownerName,
        ];
    }
}
