<?php

namespace Tests\Backend\Unit\Console;

use App\Notifications\TestEmail;
use Illuminate\Support\Facades\Notification;
use Tests\Backend\TestCase;

class TestEmailConfigTest extends TestCase
{
    /**
     * Test the command sends an email successfully.
     *
     * @return void
     */
    public function test_handle_success()
    {
        Notification::fake();

        $this->artisan('mail:test')
            ->expectsQuestion('Recipient email address', 'test@example.com')
            ->expectsOutput('Test email sent successfully')
            ->assertSuccessful();

        Notification::assertSentOnDemand(
            TestEmail::class,
            function (TestEmail $notification, array $channels, object $notifiable) {
                // Check the email content
                $mail = $notification->toMail($notifiable)->toArray();
                $this->assertEquals('This is a test email to check the email configuration.', $mail['introLines'][0]);

                // Check the email recipient
                $this->assertEquals(['test@example.com'], $notifiable->routes['mail']);

                return true;
            }
        );
    }

    /**
     * Test the command sends an email successfully if the email is passed as an argument.
     *
     * @return void
     */
    public function test_passing_email()
    {
        Notification::fake();

        $this->artisan('mail:test test@example.com')
            ->expectsOutput('Test email sent successfully')
            ->assertSuccessful();

        Notification::assertSentOnDemand(
            TestEmail::class,
            function (TestEmail $notification, array $channels, object $notifiable) {
                // Check the email content
                $mail = $notification->toMail($notifiable)->toArray();
                $this->assertEquals('This is a test email to check the email configuration.', $mail['introLines'][0]);

                // Check the email recipient
                $this->assertEquals(['test@example.com'], $notifiable->routes['mail']);

                return true;
            }
        );
    }

    /**
     * Test the command validates the email address.
     */
    public function test_handle_validation()
    {
        Notification::fake();

        $this->artisan('mail:test')
            ->expectsQuestion('Recipient email address', 'invalid-email')
            ->assertFailed();
    }

    /**
     * Test the command fails to send an email.
     *
     * @return void
     */
    public function test_handle_failure()
    {
        Notification::fake();

        // Simulate an exception when sending the email
        Notification::shouldReceive('sendNow')
            ->andThrow(new \Exception('SMTP server not found'));

        $this->artisan('mail:test')
            ->expectsQuestion('Recipient email address', 'test@example.com')
            ->expectsOutput('Failed to send test email: SMTP server not found')
            ->assertFailed();
    }
}
