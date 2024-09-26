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
     * @param  string  $locale  Locale name (e.g. 'en')
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
        $locales = array_keys(config('app.enabled_locales'));
        foreach ($locales as $locale) {
            Cache::forever('locale-'.$locale, $this->buildJsonLocale($locale));
        }

        return $locales;
    }

    /**
     * Get locale data from filesystem
     *
     * @param  string  $locale  Locale name (e.g. 'en')
     * @param  bool  $withFallback  Load fallback locale for untranslated strings
     * @param  bool  $withCustom  Load custom locale to overwrite existing translations
     * @return array Locale data
     */
    private function getLocaleData(string $locale, bool $withFallback = true, bool $withCustom = true): array
    {
        // Directories to search for locale files
        $localeDirs = [config('app.default_locale_dir')];
        // If overwrite is enabled, add overwrite directory	to directory list
        if ($withCustom) {
            $localeDirs[] = config('app.custom_locale_dir');
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
                'root' => $localeDir,
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

                // Create to merge with existing locale data (overwrite existing translations)
                if (! isset($localeContents[$group])) {
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
     * @param  string  $locale  Locale name (e.g. 'en')
     * @param  bool  $withFallback  Load fallback locale for untranslated strings
     * @param  bool  $withCustom  Load custom locale to overwrite existing translations
     * @return string
     */
    public function buildJsonLocale(string $locale, bool $withFallback = true, bool $withCustom = true)
    {
        $localeData = $this->getLocaleData($locale, $withFallback, $withCustom);

        return json_encode($localeData, JSON_UNESCAPED_UNICODE);
    }

    //

    /**
     * Get all locales from config files
     *
     * @param  string  $localeDir  Path to locale directory
     * @return array Array of locales, keyed by locale name (e.g. 'en') value is metadata
     */
    public static function getLocalesFromConfigFiles(string $localeDir): array
    {
        $locales = [];

        $configFiles = glob($localeDir.'/*/metadata.json');

        // Go through all config files
        foreach ($configFiles as $file) {
            // Get metadata from file
            $metadata = json_decode(file_get_contents($file), true);
            $locale = basename(dirname($file));

            $locales[$locale] = $metadata;
        }

        return $locales;
    }

    /**
     * Get list of locales that should be enabled
     *
     * @param  array  $defaultLocales  Array of default locales (provided by the app)
     * @param  array  $customLocales  Array of custom locales (provided by the user)
     * @param  array|null  $whitelist  Array of locales that should be enabled (null = all locales)
     * @return array Array of locales, keyed by locale name (e.g. 'en') value is metadata
     */
    public static function getEnabledLocales(array $defaultLocales, array $customLocales, ?array $whitelist): array
    {
        $availableLocales = [];

        // Add all default locales to list of available locales
        foreach ($defaultLocales as $locale => $metadata) {
            $availableLocales[$locale] = $metadata;
        }

        // Add all custom locales and overwrite existing locales metadata
        foreach ($customLocales as $locale => $metadata) {
            // If locale does not exist yet, add it
            if (! isset($availableLocales[$locale])) {
                $availableLocales[$locale] = $metadata;

                continue;
            }

            // Overwrite existing locale metadata by merging existing metadata with custom metadata
            $availableLocales[$locale] = array_replace_recursive($availableLocales[$locale], $metadata);
        }

        // Remove locales that are not whitelisted or have no name set in metadata
        return array_filter($availableLocales, function ($metadata, $locale) use ($whitelist) {
            if ($whitelist !== null && ! in_array($locale, $whitelist)) {
                return false;
            }

            if (! isset($metadata['name'])) {
                return false;
            }

            return true;
        }, ARRAY_FILTER_USE_BOTH);
    }
}
