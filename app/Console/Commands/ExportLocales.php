<?php

namespace App\Console\Commands;

use App\Services\LocaleService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

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
    protected $description = 'Export locales to json files for eslint';

    /**
     * Execute the console command.
     */
    public function handle(LocaleService $localeService): void
    {
        $disk = Storage::build([
            'driver' => 'local',
            'root'   => 'tests/Fixtures/Locales',
        ]);

        $locales = config('app.default_locales');

        foreach ($locales as $locale => $metadata) {
            $this->info('Processing locale ' . $metadata['name'].' ('.$locale.')');

            $localeJson = $localeService->buildJsonLocale($locale, false, false);

            $disk->put($locale . '.json', $localeJson);
        }
    }
}
