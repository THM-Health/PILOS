<?php

namespace App\Services;

use Illuminate\Filesystem\Filesystem;

class LocaleService
{
    protected $filesystem;
    protected $locales = [];

    public function __construct()
    {
        $this->filesystem = new Filesystem();
    }

    public function getLocales(): array
    {
        if (empty($this->locales)) {
            $this->locales = $this->getLocalesFromDir();
        }

        return $this->locales;
    }

    public function getLocalesFromDir()
    {
        $localeDirs = glob(base_path('lang') . '/*', GLOB_ONLYDIR);
        $locales    = [];
        foreach ($localeDirs as $localeDir) {
            $locale    = basename($localeDir);
            $locales[] = $locale;
        }

        return $locales;
    }

    public function getJsonLocale($locale)
    {
        if (!in_array($locale, $this->getLocales())) {
            throw new \Exception('Locale ' . $locale . ' not found');
        }

        $localeDir      = base_path('lang') . '/' . $locale;
        $localeFiles    = glob($localeDir . '/*.php');
        $localeContents = [];
        foreach ($localeFiles as $localeFile) {
            $group                  = basename($localeFile, '.php');
            $localeData             = $this->filesystem->getRequire($localeFile);
            $localeContents[$group] = $localeData;
        }
        $localeJson = json_encode($localeContents, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        return $localeJson;
    }
}
