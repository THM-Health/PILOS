<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

use function Laravel\Prompts\text;

class TestEmailConfig extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:test {email?}';

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
        $email = $this->argument('email') ?: text('Recipient email address');

        // Send the test email
        try {
            \Mail::raw('This is a test email', function ($message) use ($email) {
                $message->to($email);
                $message->subject('Test email');
            });
            $this->info('Test email sent successfully');

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Failed to send test email: '.$e->getMessage());

            return self::FAILURE;
        }
    }
}
