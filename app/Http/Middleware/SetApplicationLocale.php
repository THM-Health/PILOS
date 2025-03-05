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
     * @param  \Illuminate\Http\Request  $request
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        $locale = '';
        foreach ($request->getLanguages() as $language) {
            if (in_array($language, array_keys(config('app.enabled_locales')))) {
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

        // If locale is not present in enabled locales, fallback to another locale
        if (! in_array($locale, array_keys(config('app.enabled_locales')))) {
            $fallbackLocale = config('app.fallback_locale');

            // If fallback locale is present in enabled locales, use it
            if (in_array($fallbackLocale, array_keys(config('app.enabled_locales')))) {
                $locale = $fallbackLocale;
            } else {
                // Otherwise, use the first enabled locale
                $locale = array_key_first(config('app.enabled_locales'));
            }
        }

        app()->setLocale($locale);

        return $next($request);
    }
}
