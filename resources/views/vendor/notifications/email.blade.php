@component('mail::layout')

{{-- Header --}}
@slot('header')
@component('mail::header', ['url' => config('app.url')])
<img src="{{config('app.url')}}/{{ setting('logo') }}" class="logo" alt="Logo {{setting('name')}}">
@endcomponent
@endslot

# @lang('mail.greeting', ['name' => $name])

{{-- Intro Lines --}}
@foreach ($introLines as $line)
{{ $line }}

@endforeach

{{-- Action Button --}}
@isset($actionText)
<?php
    switch ($level) {
        case 'success':
        case 'error':
            $color = $level;
            break;
        default:
            $color = 'primary';
    }
?>
@component('mail::button', ['url' => $actionUrl, 'color' => $color])
{{ $actionText }}
@endcomponent
@endisset

{{-- Outro Lines --}}
@foreach ($outroLines as $line)
{{ $line }}

@endforeach

{{-- Salutation --}}
@lang('mail.regards')<br>
{{ setting('name') }}

{{-- Subcopy --}}
@isset($actionText)
@slot('subcopy')
@component('mail::subcopy')
@lang('mail.action_url', [ 'actionText' => $actionText ]) <span class="break-all">[{{ $displayableActionUrl }}]({{ $actionUrl }})</span> .
@endcomponent
@endslot
@endisset

{{-- Footer --}}
@slot('footer')
    @component('mail::footer')
        © {{ date('Y') }} {{ setting('name') }}. @lang('All rights reserved.')
    @endcomponent
@endslot

@endcomponent
