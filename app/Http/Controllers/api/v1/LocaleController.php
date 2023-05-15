<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;

class LocaleController extends Controller
{
    public function get($locale)
    {
        $localeService = new \App\Services\LocaleService();
        $localeJson    = $localeService->getJsonLocale($locale);

        return response($localeJson, 200)->header('Content-Type', 'application/json');
    }
}
