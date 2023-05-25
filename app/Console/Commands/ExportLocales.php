<?php

namespace App\Console\Commands;

use App\Services\LocaleService;
use Illuminate\Console\Command;

class ExportLocales extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'locales:export';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Explort locales to json files for eslint';

    /**
     * Execute the console command.
     */
    public function handle(LocaleService $localeService): void
    {
        $locales = config('app.default_locales');
        foreach ($locales as $locale) {
            $this->info('Processing locale ' . $locale);

            $localeJson = $localeService->buildJsonLocale($locale, false, false);

            file_put_contents(
                base_path('tests/Fixtures/Locales/' . $locale . '.json'),
                $localeJson
            );
        }
    }
}
