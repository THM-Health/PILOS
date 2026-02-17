@extends("layouts.error")

@section("title", $title)
@section("message", $message)
@section("code", $code)

@push("scripts")
    <script>
        if (window.opener) {
            window.opener.postMessage(
                {
                    type: @json($type),
                },
                "{{config('app.url')}}"
            );
            window.opener.focus();
            window.close();
        }
    </script>
@endpush
