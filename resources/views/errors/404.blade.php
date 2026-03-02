@extends("layouts.error")

@section("title", "Not Found")
@section("message", "Not Found")
@section("code", 404)

@push("scripts")
    <script>
        if (window.opener) {
            window.opener.postMessage(
                {
                    type: "file_not_found",
                },
                "{{config('app.url')}}"
            );
            window.opener.focus();
            window.close();
        }
    </script>
@endpush
