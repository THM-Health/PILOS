<?php

namespace App\Console\Commands;

use App\Services\LocaleService;
use Http;
use Illuminate\Console\Command;

class UploadLocalesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'locales:upload {--overwrite}';

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
        $overwrite = $this->option('overwrite');
        if ($overwrite) {
            $this->info('Overwriting existing translations');

            $locales = config('app.default_locales');
            foreach ($locales as $locale => $metadata) {
                $this->info('Processing locale '.$metadata['name'].' ('.$locale.')');

                $localeJson = $localeService->buildJsonLocale($locale, false, false);

                $delay = config('services.poeditor.upload_delay');
                $this->info('Waiting '.$delay.' seconds before upload');
                sleep($delay);

                $this->info('Uploading locale '.$metadata['name'].' ('.$locale.')');

                $response = Http::attach(
                    'file',
                    $localeJson,
                    $locale.'.json'
                )->post('https://api.poeditor.com/v2/projects/upload', [
                    'api_token' => config('services.poeditor.token'),
                    'id' => config('services.poeditor.project'),
                    'updating' => 'terms_translations',
                    'overwrite' => 1,
                    'sync_terms' => config('app.locale') == $locale ? 1 : 0,
                    'fuzzy_trigger' => 1,
                    'language' => $locale,
                ]);

                $apiResponse = $response->json('response');
                if ($apiResponse['status'] == 'success') {
                    $this->info('Locale '.$metadata['name'].' ('.$locale.') uploaded successfully');
                } else {
                    $this->error('Error uploading locale '.$metadata['name'].' ('.$locale.')');
                    $this->error('Error code: '.$apiResponse['code'].', message: '.$apiResponse['message']);
                }
            }

            return;
        }

        $this->info('Sync terms and default locale');
        $locale = config('app.locale');
        $localeJson = $localeService->buildJsonLocale($locale, false, false);

        $response = Http::attach(
            'file',
            $localeJson,
            $locale.'.json'
        )->post('https://api.poeditor.com/v2/projects/upload', [
            'api_token' => config('services.poeditor.token'),
            'id' => config('services.poeditor.project'),
            'updating' => 'terms_translations',
            'overwrite' => 1,
            'sync_terms' => 1,
            'fuzzy_trigger' => 1,
            'language' => $locale,
        ]);

        $apiResponse = $response->json('response');
        if ($apiResponse['status'] == 'success') {
            $this->info('Uploaded successfully');
        } else {
            $this->error('Error uploading');
            $this->error('Error code: '.$apiResponse['code'].', message: '.$apiResponse['message']);
        }

    }
}
