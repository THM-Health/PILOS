@extends("layouts.error")

@section("title", "Not Found")
@section("message", "Not Found")
@section("code", 404)

@push("scripts")
    <script>
        if (window.opener) {
            window.opener.postMessage(
                {
                    type: @json(\App\Enums\CustomErrorMessages::NOT_FOUND->value)
                },
                "{{config('app.url')}}"
            );
            window.opener.focus();
            window.close();
        }
    </script>
@endpush
