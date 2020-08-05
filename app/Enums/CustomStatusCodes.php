<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * Lobby/Waiting room settings enum
 * @package App\Enums
 */
final class CustomStatusCodes extends Enum
{
    const MEETING_NOT_RUNNING   =   460;
    const NO_SERVER_AVAILABLE   =   461;
}
