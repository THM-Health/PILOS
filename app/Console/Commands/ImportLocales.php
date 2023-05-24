<?php

namespace App\Console\Commands;

use Http;
use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Facades\Process;
use Symfony\Component\VarExporter\VarExporter;

class ImportLocales extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'locales:import';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import locales from POEditor';

    /**
     * Execute the console command.
     */
    public function handle(Filesystem $filesystem): void
    {
        $this->info('Importing locales from POEditor');
        $this->info('Fetching languages list');
        $response = Http::asForm()->post('https://api.poeditor.com/v2/languages/list', [
            'api_token' => config('services.poeditor.token'),
            'id'        => config('services.poeditor.project'),
        ]);

        if ($response->failed()) {
            $this->error('Failed to fetch languages list');

            return;
        }

        foreach ($response->json('result.languages') as $lang) {
            $this->info('Found '.$lang['name'].' ('.$lang['code'].')');

            $this->info('Downloading translation for '.$lang['code']);
            $response = Http::asForm()->post('https://api.poeditor.com/v2/projects/export', [
                'api_token' => config('services.poeditor.token'),
                'id'        => config('services.poeditor.project'),
                'language'  => $lang['code'],
                'type'      => 'key_value_json'
            ]);

            if ($response->failed()) {
                $this->error('Failed to load translation for '.$lang['code']);

                return;
            }

            $url = $response->json('result.url');

            $localeFile = Http::get($url)->body();
        
            // Read the JSON file and decode its contents
            $localeData = json_decode($localeFile, true);

            // Get all major keys (groups) in the locale data, e.g. app, auth, validation, etc.
            $groups = array_keys($localeData);

            // Iterate over each group and generate PHP language files
            foreach ($groups as $group) {
                // Create the directory for the language if it doesn't exist
                $localeDir = config('app.locale_dir').'/'.$lang['code'];
                if (!is_dir($localeDir)) {
                    $filesystem->makeDirectory($localeDir);
                }

                // Export the group data as a PHP array
                $exported = VarExporter::export($localeData[$group]);

                // Write the PHP array to the language file
                file_put_contents(
                    base_path('lang/' . $lang['code'] . '/' . $group . '.php'),
                    '<?php return ' . $exported . ';'
                );
            }
        }

        $this->info('Apply coding standards');
        Process::run('composer run fix-cs '.config('app.locale_dir'));
    }
}
