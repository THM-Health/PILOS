<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link type="image/x-icon" rel="icon" href="{{ setting('favicon') }}">
    <title>{{ setting('name') }}</title>

    <!-- Scripts -->
    @vite(['resources/js/app.js', 'resources/sass/theme/'.config('app.theme').'/app.scss'])
</head>
<body>
    <div id='app'/>
</body>
</html>
