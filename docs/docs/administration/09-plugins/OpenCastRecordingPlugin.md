---
title: OpenCastRecordingPlugin
description: Create metadata to send to BigBlueButton for OpenCast recordings.
---

# OpenCastRecordingPlugin

The OpenCastRecordingPlugin is used to create metadata to send to BigBlueButton during the create meeting api call for the OpenCast integration in BigBlueButton. 

The plugin has to implements the `OpenCastRecordingContract` contract with the following method:

```php
/**
 * Provides the metadata send to the BigBlueButton server during the create meeting api call
 * for the OpenCast Integration in BigBlueButton
 *
 * @param  string  $meetingId  The unique identifier of the meeting.
 * @param  string  $roomId  The unique identifier of the room where the meeting belongs to.
 * @param  string  $roomName  The name of the room where the meeting belongs to.
 * @param  string  $ownerName  The name of the owner of the room.
 * @param  string  $ownerEmail  The email of the owner of the room.
 * @param  string  $ownerAuthenticator  The authenticator (local, ldap, shibboleth, ...) of the owner of the room.
 * @param  string  $ownerExternalId  The external identifier (username) of the owner of the room.
 * @return array The metadata of the meeting.
 */
public function getMetadata(string $meetingId, string $roomId, string $roomName, string $ownerName, string $ownerEmail, string $ownerAuthenticator, string $ownerExternalId): array;
```

The default plugin implementation can be found in the `app/Plugins/Defaults/OpenCastRecordingPlugin.php` file.
