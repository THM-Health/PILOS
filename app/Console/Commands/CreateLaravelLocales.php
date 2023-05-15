<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;
use Symfony\Component\VarExporter\VarExporter;

class CreateLaravelLocales extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'create:laravel-locales';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create Laravel locales from JSON files';

    /**
     * Handle the process of generating language files from JSON files.
     */
    public function handle(): void
    {
        $filesystem = new Filesystem();

        // Get all JSON files in the "locales" directory
        $localeFiles = glob(base_path('locales') . '/*.json');

        // Process each locale file
        foreach ($localeFiles as $localeFile) {
            // Extract the locale name from the file name
            $locale = basename($localeFile, '.json');
            $this->info('Processing locale ' . $locale);

            // Read the JSON file and decode its contents
            $localeData = json_decode(file_get_contents($localeFile), true);

            // Get all major keys (groups) in the locale data, e.g. app, auth, validation, etc.
            $groups = array_keys($localeData);

            // Iterate over each group and generate PHP language files
            foreach ($groups as $group) {
                // Create the directory for the language if it doesn't exist
                if (!is_dir(base_path('lang/' . $locale))) {
                    $filesystem->makeDirectory(base_path('lang/' . $locale));
                }

                // Export the group data as a PHP array
                $exported = VarExporter::export($localeData[$group]);

                // Write the PHP array to the language file
                file_put_contents(
                    base_path('lang/' . $locale . '/' . $group . '.php'),
                    '<?php return ' . $exported . ';'
                );
            }
        }
    }
}
