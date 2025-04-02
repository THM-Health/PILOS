<?php

namespace App\Services;

use App\Models\Meeting;

class StreamingServiceFactory
{
    public static function make(Meeting $meeting): StreamingService
    {
        return new StreamingService($meeting);
    }
}
