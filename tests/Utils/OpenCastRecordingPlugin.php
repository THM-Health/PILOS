<?php

namespace Tests\Utils;

use App\Plugins\Contracts\OpenCastRecordingPluginContract;

class OpenCastRecordingPlugin implements OpenCastRecordingPluginContract
{
    public function getMetadata(string $meetingId, string $roomId, string $roomName, string $ownerName, string $ownerEmail, string $ownerAuthenticator, string $ownerExternalId): array
    {
        return [
            'opencast-dc-title' => $roomName,
            'opencast-dc-identifier' => $meetingId,
            'opencast-dc-creator' => $ownerExternalId,
            'opencast-dc-created' => now()->toIso8601ZuluString(),
            'opencast-dc-language' => 'DE',
        ];
    }
}
