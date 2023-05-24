<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangeLocaleRequest;
use App\Services\LocaleService;
use Auth;

class LocaleController extends Controller
{
    public function show($locale, LocaleService $localeService)
    {
        if (!in_array($locale, config('app.enabled_locales'))) {
            abort(404, 'Locale not found');
        }

        $localeJson = $localeService->getJsonLocale($locale);
        
        return response($localeJson, 200)->header('Content-Type', 'application/json');
    }

    public function update(ChangeLocaleRequest $request)
    {
        session()->put('locale', $request->input('locale'));

        if (Auth::user() !== null) {
            Auth::user()->update([
                'locale' => $request->input('locale')
            ]);
        }
    }
}
