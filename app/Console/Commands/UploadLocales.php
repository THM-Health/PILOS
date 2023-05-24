<?php

namespace App\Console\Commands;

use App\Services\LocaleService;
use Http;
use Illuminate\Console\Command;

class UploadLocales extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'locales:upload';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Upload locales to POEditor';

    /**
     * Execute the console command.
     */
    public function handle(LocaleService $localeService): void
    {
        $locales = config('app.default_locales');
        foreach ($locales as $locale) {
            $this->info('Processing locale ' . $locale);

            $localeJson = $localeService->buildJsonLocale($locale, false, false);

            $this->info('Waiting 20 seconds before upload');
            sleep(20);

            $this->info('Uploading locale ' . $locale);

            $response = Http::attach(
                'file',
                $localeJson,
                $locale . '.json'
            )->post('https://api.poeditor.com/v2/projects/upload', [
                'api_token'     => config('services.poeditor.token'),
                'id'            => config('services.poeditor.project'),
                'updating'      => 'terms_translations',
                'overwrite'     => 1,
                'sync_terms '   => 1,
                'fuzzy_trigger' => 1,
                'language'      => $locale
            ]);

            $apiResponse = $response->json('response');
            if ($apiResponse['status'] == 'success') {
                $this->info('Locale ' . $locale . ' uploaded successfully');
            } else {
                $this->error('Error uploading locale ' . $locale);
                $this->error('Error code: ' . $apiResponse['code'].', message: '.$apiResponse['message']);
            }
        }
    }
}
