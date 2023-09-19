<?php

namespace App\Services;

use Cache;
use Illuminate\Filesystem\Filesystem;
use Storage;

class LocaleService
{
    protected Filesystem $filesystem;

    public function __construct(Filesystem $filesystem)
    {
        $this->filesystem = $filesystem;
    }

    /**
     * Get locale data as JSON
     * If a cached version exists, it will be returned otherwise it will be built and not cached
     *
     * @param  string $locale Locale name (e.g. 'en')
     * @return string
     */
    public function getJsonLocale(string $locale): string
    {
        if (Cache::has('locale-'.$locale)) {
            return Cache::get('locale-'.$locale);
        }
        
        return $this->buildJsonLocale($locale);
    }

    /**
     * Build locale cache for all enabled locales
     *
     * @return array List of locales that have been built
     */
    public function buildCache(): array
    {
        $locales = config('app.enabled_locales');
        foreach ($locales as $locale) {
            Cache::forever('locale-'.$locale, $this->buildJsonLocale($locale));
        }

        return $locales;
    }

    /**
     * Get locale data from filesystem
     *
     * @param  string  $locale       Locale name (e.g. 'en')
     * @param  boolean $withFallback Load fallback locale for untranslated strings
     * @param  boolean $withCustom   Load custom locale to overwrite existing translations
     * @return array   Locale data
     */
    private function getLocaleData(string $locale, bool $withFallback = true, bool $withCustom = true): array
    {
        // Directories to search for locale files
        $localeDirs = [ config('app.locale_dir') ];
        // If overwrite is enabled, add overwrite directory	to directory list
        if ($withCustom) {
            $localeDirs[] = config('app.locale_custom_dir');
        }

        // Locale / translation data
        $localeContents = [];

        // If locale fallback is enabled, load fallback locale and overwrite with current locale
        if ($withFallback && config('app.fallback_locale') != $locale) {
            $localeContents = $this->getLocaleData(config('app.fallback_locale'), false, false);
        }
       
        // Go through all locale directories
        foreach ($localeDirs as $localeDir) {
            $disk = Storage::build([
                'driver' => 'local',
                'root'   => $localeDir,
            ]);

            // Get all files in locale directory
            $localeFiles = $disk->files($locale);
            // Go through all locale files
            foreach ($localeFiles as $localeFile) {
                $path_parts = pathinfo($localeFile);

                // Skip non-PHP files
                if ($path_parts['extension'] != 'php') {
                    continue;
                }

                // Get group name / prefix from filename e.g. 'app' from 'app.home'
                $group = $path_parts['filename'];

                // Get locale data from file
                $localeData = $this->filesystem->getRequire($disk->path($localeFile));

                // Create to merge with existing locale data (ovewrite existing translations)
                if (!isset($localeContents[$group])) {
                    $localeContents[$group] = [];
                }
                $localeContents[$group] = array_replace_recursive($localeContents[$group], $localeData);
            }
        }

        return $localeContents;
    }

    /**
     * Build locale data as json
     *
     * @param  string  $locale       Locale name (e.g. 'en')
     * @param  boolean $withFallback Load fallback locale for untranslated strings
     * @param  boolean $withCustom   Load custom locale to overwrite existing translations
     * @return void
     */
    public function buildJsonLocale(string $locale, bool $withFallback = true, bool $withCustom = true)
    {
        $localeData = $this->getLocaleData($locale, $withFallback, $withCustom);

        return json_encode($localeData, JSON_UNESCAPED_UNICODE);
    }
}
