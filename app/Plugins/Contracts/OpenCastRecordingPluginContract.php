<?php

namespace App\Plugins\Contracts;

interface OpenCastRecordingPluginContract
{
    public function getMetadata(string $meetingId, string $roomId, string $roomName, string $ownerName, string $ownerEmail, string $ownerAuthenticator, string $ownerExternalId): array;
}
