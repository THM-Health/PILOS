<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;
use Storage;
use Symfony\Component\VarExporter\VarExporter;

class ImportLocalesFromFileCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'locales:file-import {locale} {file}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import locales from file';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $disk = Storage::build([
            'driver' => 'local',
            'root' => config('app.default_locale_dir'),
        ]);

        $locale = $this->argument('locale');
        $file = $this->argument('file');

        $this->info('Importing '.$locale.' from '.$file);

        $response = json_decode(file_get_contents($file), true);

        // Get all major keys (groups) in the locale data, e.g. app, auth, validation, etc.
        $groups = array_keys($response);

        // Iterate over each group and generate PHP language files
        foreach ($groups as $group) {
            $this->recur_ksort($response[$group]);
            // Export the group data as a PHP array
            $exported = VarExporter::export($response[$group]);

            // Write the PHP array to the language file
            $disk->put($locale.'/'.$group.'.php', '<?php return '.$exported.';');
        }

        $this->info('Apply coding standards');
        Process::run('composer run fix-cs '.config('app.default_locale_dir'));
    }

    /**
     * Recursively sort the locale array by key.
     *
     * @param  array  $array  Locale data
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
