<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-theme="{{COLOR_MODE}}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title inertia>{{ config('app.name') }}</title>
    <link rel="stylesheet" href="{{ asset('css/boilercraft-theme.css') }}">
    {{VITE_TAGS}}
    @inertiaHead
</head>
<body>
    @inertia
    <script src="{{ asset('js/boilercraft-theme.js') }}"></script>
</body>
</html>
