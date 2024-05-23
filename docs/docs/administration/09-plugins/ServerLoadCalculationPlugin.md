---
title: ServerLoadCalculation
description: Determines the load of a BigBlueButton server used by the load balancer.
---

# ServerLoadCalculation
This plugin is used to determine the load of a BigBlueButton server used by the load balancer.

The plugin has to implements the `ServerLoadCalculationContract` contract with the following method:

```php
/**
 * Calculates and returns the server load based on the provided meetings.
 *
 * @param  Meeting[]  $meetings  An array of Meeting objects.
 * @return int The calculated server load.
 */
public function getLoad(array $meetings): int;
```

The default plugin implementation can be found in the `app/Plugins/Defaults/ServerLoadCalculationPlugin.php` file.

### Example of a custom implementation
In this example the load of a BigBlueButton server is calculated based on the video streams, voice participants and participants.

```php
<?php

namespace App\Plugins\Custom;

use App\Plugins\Contracts\ServerLoadCalculationPluginContract;

class ServerLoadCalculationPlugin implements ServerLoadCalculationPluginContract
{
    private const PARTICIPANT_WEIGHT = 1;

    private const AUDIO_WEIGHT = 2;

    private const VIDEO_WEIGHT = 3;

    public function getLoad(array $meetings): int
    {
        $videoCount = 0;
        $voiceParticipantCount = 0;
        $participantCount = 0;

        foreach ($meetings as $meeting) {
            $videoCount += $meeting->getVideoCount();
            $voiceParticipantCount += $meeting->getVoiceParticipantCount();
            $participantCount += $meeting->getParticipantCount();
        }

        $videoLoad = $videoCount * self::VIDEO_WEIGHT;
        $voiceLoad = $voiceParticipantCount * self::AUDIO_WEIGHT;
        $participantLoad = ($participantCount - $voiceLoad) * self::PARTICIPANT_WEIGHT;

        return $videoLoad + $voiceLoad + $participantLoad;
    }
}
```
