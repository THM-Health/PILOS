<?php

namespace App\Console\Commands;

use App\Services\LocaleService;
use Illuminate\Console\Command;

class CacheLocalesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'locales:cache';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create cache for all enabled locales';

    /**
     * Execute the console command.
     */
    public function handle(LocaleService $localeService): void
    {
        $locales = $localeService->buildCache();
        $this->info('Locales [ '.implode(', ', $locales).' ] cached successfully');
    }
}
