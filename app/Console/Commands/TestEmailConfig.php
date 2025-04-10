<?php

namespace App\Console\Commands;

use App\Notifications\TestEmail;
use Illuminate\Console\Command;
use Illuminate\Contracts\Console\PromptsForMissingInput;
use Notification;

use function Laravel\Prompts\text;

class TestEmailConfig extends Command implements PromptsForMissingInput
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:test {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a test email to validate config';

    /**
     * Prompt for missing input arguments using the returned questions.
     *
     * @return array<string, string>
     */
    protected function promptForMissingArgumentsUsing(): array
    {
        return [
            'email' => fn () => text(label: 'Recipient email address', validate: ['email' => 'required|email']),
        ];
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Send the test email
        try {
            Notification::route('mail', [$this->argument('email')])->notifyNow(new TestEmail);

            $this->info('Test email sent successfully');

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Failed to send test email: '.$e->getMessage());

            return self::FAILURE;
        }
    }
}
