<?php

namespace App\Console\Commands;

use Http;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;
use Storage;
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
    public function handle(): void
    {
        $disk = Storage::build([
            'driver' => 'local',
            'root'   => config('app.locale_dir'),
        ]);

        $this->info('Importing locales from POEditor');
        $this->info('Fetching languages list');
        $response = Http::asForm()->post('https://api.poeditor.com/v2/languages/list', [
            'api_token' => config('services.poeditor.token'),
            'id'        => config('services.poeditor.project'),
        ]);

        $apiResponse = $response->json('response');
        if ($apiResponse['status'] == 'fail') {
            $this->error('Failed to fetch languages list');
            $this->error('Error code: ' . $apiResponse['code'].', message: '.$apiResponse['message']);

            return;
        }

        foreach ($response->json('result.languages') as $lang) {
            $this->info('Found '.$lang['name'].' ('.$lang['code'].')');

            $this->info('Fetching translation for '.$lang['code']);
            $response = Http::asForm()->post('https://api.poeditor.com/v2/projects/export', [
                'api_token' => config('services.poeditor.token'),
                'id'        => config('services.poeditor.project'),
                'language'  => $lang['code'],
                'type'      => 'key_value_json'
            ]);

            $apiResponse = $response->json('response');
            if ($apiResponse['status'] == 'fail') {
                $this->error('Failed to fetch translation for '.$lang['code']);
                $this->error('Error code: ' . $apiResponse['code'].', message: '.$apiResponse['message']);

                return;
            }

            $url = $response->json('result.url');

            $this->info('Downloading translation for '.$lang['code']);
            
            $response = Http::get($url)->json();
           
            // Check if response is an error
            if (isset($response['response']['status'])) {
                if ($response['response']['status'] == 'fail') {
                    $this->error('Failed to download translation for '.$lang['code']);
                    $this->error('Error code: ' . $response['response']['code'].', message: '.$response['response']['message']);

                    return;
                }
            }

            // Get all major keys (groups) in the locale data, e.g. app, auth, validation, etc.
            $groups = array_keys($response);

            // Iterate over each group and generate PHP language files
            foreach ($groups as $group) {
                $this->recur_ksort($response[$group]);
                // Export the group data as a PHP array
                $exported = VarExporter::export($response[$group]);

                // Write the PHP array to the language file
                $disk->put($lang['code'] . '/' . $group . '.php', '<?php return ' . $exported . ';');
            }
        }

        $this->info('Apply coding standards');
        Process::run('composer run fix-cs '.config('app.locale_dir'));
    }

    /**
     * Recursively sort the locale array by key.
     *
     * @param  array $array Locale data
     * @return void
     */
    public function recur_ksort(&$array)
    {
        foreach ($array as &$value) {
            if (is_array($value)) {
                $this->recur_ksort($value);
            }
        }
        ksort($array);
    }
}
