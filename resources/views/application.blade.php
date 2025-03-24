<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="csp-nonce" content="{{ app('csp-nonce') }}">
    <link type="image/x-icon" rel="icon" media="(prefers-color-scheme: light)" href="{{ app(\App\Settings\ThemeSettings::class)->favicon }}">
    <link type="image/x-icon" rel="icon" media="(prefers-color-scheme: dark)" href="{{ app(\App\Settings\ThemeSettings::class)->favicon_dark }}">
    <title>{{ app(\App\Settings\GeneralSettings::class)->name }}</title>

    <!-- Scripts -->
    @vite(['resources/js/app.js', 'resources/sass/app.scss'])
</head>
<body class="bg-surface-50 dark:bg-surface-950">
    <div id='app'>
    </div>
</body>
</html>
