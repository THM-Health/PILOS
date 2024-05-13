---
title: ServerLoadCalculation
description: Determines the load of a BigBlueButton server used by the load balancer.
---

# ServerLoadCalculation
This plugin is used to determine the load of a BigBlueButton server used by the load balancer.

The plugin implements the `ServerLoadCalculationContract` contract.

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
