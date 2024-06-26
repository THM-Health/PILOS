<?php

namespace Tests\Backend\Utils;

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
