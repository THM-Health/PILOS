<?php

namespace App\Console\Commands;

use Http;
use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;

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
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $filesystem = new Filesystem();
    
        $localeDirs = glob(base_path('lang') . '/*', GLOB_ONLYDIR);
        foreach ($localeDirs as $localeDir) {
            $locale = basename($localeDir);
            $this->info('Processing locale ' . $locale);

            $localeFiles = glob($localeDir . '/*.php');

            $localeContents = [];
            foreach ($localeFiles as $localeFile) {
                $group = basename($localeFile, '.php');
                $this->info('Processing group ' . $group);

                $localeData             = $filesystem->getRequire($localeFile);
                $localeContents[$group] = $localeData;
            }

            $localeJson = json_encode($localeContents, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            
            $this->info('Uploading locale ' . $locale);

            $response = Http::attach(
                'file',
                $localeJson,
                $locale . '.json'
            )->post('https://api.poeditor.com/v2/projects/upload', [
                'api_token'     => config('services.poeditor.token'),
                'id'            => config('services.poeditor.project'),
                'updating'      => 'terms_translations',
                'overwrite'     => '1',
                'fuzzy_trigger' => '1',
                'language'      => $locale
            ]);

            $this->info('Waiting 20 seconds before next upload');
            sleep(20);
        }
    }
}
