<!--Warning! Don't use any indentation! See Laravel docs Mail!-->
@component('mail::message')

@lang('email.invite.greetings') {{$invitation->email}},

@lang('email.invite.message')

@component('mail::button', ['url' => env('APP_URL') . '/register?invitation_token=' . $invitation->invitation_token, 'color' => 'success'])
@lang('email.invite.register')
@endcomponent

@endcomponent
