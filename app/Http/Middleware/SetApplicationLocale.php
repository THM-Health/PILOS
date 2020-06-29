<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;

class SetApplicationLocale
{
    /**
     * Sets the locale of the application to the users locale.
     *
     * If the user is authenticated and a locale is persisted for the user in the database, this locale will be set.
     * Otherwise the locale of the session or the locale from the 'Accept-Language'-Header will be used if set. For the
     * last instance the fallback locale of the application will be used.
     *
     * @param  \Illuminate\Http\Request $request
     * @param  \Closure                 $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        $locale = '';
        foreach ($request->getLanguages() as $language) {
            if (in_array($language, config('app.available_locales'))) {
                $locale = $language;
                break;
            }
        }

        if (Auth::user() !== null && Auth::user()->locale !== null) {
            $locale = Auth::user()->locale;
            session()->put('locale', $locale);
        } elseif (session()->has('locale')) {
            $locale = session()->get('locale');
        }

        if (!in_array($locale, config('app.available_locales'))) {
            $locale = config('app.fallback_locale');
        }

        app()->setLocale($locale);

        return $next($request);
    }
}
