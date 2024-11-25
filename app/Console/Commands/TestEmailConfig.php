<?php

namespace App\Console\Commands;

use App\Notifications\TestEmail;
use Illuminate\Console\Command;
use Notification;

use function Laravel\Prompts\text;

class TestEmailConfig extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a test email to validate config';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Ask for the email address to send the test email
        $email = text(label: 'Recipient email address', validate: ['email' => 'required|email']);

        // Send the test email
        try {
            Notification::route('mail', [$email])->notifyNow(new TestEmail);

            $this->info('Test email sent successfully');

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Failed to send test email: '.$e->getMessage());

            return self::FAILURE;
        }
    }
}
