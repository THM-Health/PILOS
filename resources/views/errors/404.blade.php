{{--
SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
--}}

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
