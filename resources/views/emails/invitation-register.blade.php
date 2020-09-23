<!--Warning! Don't use any indentation! See Laravel docs Mail!-->
@component('mail::message')

{{__('email.invite.greetings')}} {{$invitation->email}},

{{__('email.invite.message', ['minute' => config('settings.defaults.invitation_token_expiration')])}}

@component('mail::button', ['url' => url('register?') .  http_build_query(['invitation_token' => $invitation->invitation_token]), 'color' => 'success'])
{{__('email.invite.register')}}
@endcomponent

@endcomponent
