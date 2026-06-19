<?php

namespace App\Http\Controllers;

use App\Settings\BigBlueButtonSettings;

class BBBClientSettingsController extends Controller
{
    public function __invoke(BigBlueButtonSettings $bigBlueButtonSettings)
    {
        return response($bigBlueButtonSettings->client_settings, 200, ['Content-Type' => 'application/json']);
    }
}
