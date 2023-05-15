<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;

class MakeFrontendLocales extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'make:frontend-locales';

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
        $locales = glob(base_path('lang') . '/*', GLOB_ONLYDIR);

        $filesystem = new Filesystem();
        foreach ($locales as $localeDir) {
            $locale = basename($localeDir);
            $this->info("Generating locale $locale");

            $localeData = [];

            foreach (scandir($localeDir) as $file) {
                if ($file === '.' || $file === '..') {
                    continue;
                }
                $group              = basename($file, '.php');
                $content            = $filesystem->getRequire($localeDir . '/' . $file);
                $localeData[$group] = $content;
            }

            $filesystem->replace(
                resource_path('js/lang/' . $locale . '.json'),
                json_encode($localeData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            );
        }
    }
}
