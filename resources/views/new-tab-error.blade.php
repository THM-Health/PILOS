{{--
SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
--}}

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
