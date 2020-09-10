<?php

namespace App\Mail;

use App\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InvitationRegister extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * The invitation instance.
     *
     * @var Invitation
     */
    public $invitation;

    /**
     * Create a new message instance.
     *
     * @param Invitation $invitation
     */
    public function __construct(Invitation $invitation)
    {
        $this->invitation = $invitation;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->from('pilos@test.com')->markdown('emails.invitation-register');
    }
}
