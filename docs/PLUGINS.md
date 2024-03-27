# Plugins

## Introduction
The behavior of PILOS can be customized by plugins.

We currently have the following plugins:
- ServerLoadCalculation: Determines the load of a BigBlueButton server used by the load balancer.

## Installation

In `app/Plugins/Contracts` you can find the contracts for each plugin.
In `app/Plugins/Defaults` you can find the default implementation of each plugin.

To override the default implementation of a plugin, you have to create a new class with the same name that implements the corresponding contract in the `app/Plugins/Custom` namespace/folder.

Next you have to register the class name of the plugin in the `.env` file. Multiple plugins can be registered by separating them with a comma.
```env
PLUGINS=ServerLoadCalculationPlugin
```

## ServerLoadCalculation
The `ServerLoadCalculation` plugin is used to determine the load of a BigBlueButton server used by the load balancer. The plugin has to implement the `ServerLoadCalculationContract` contract.

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
