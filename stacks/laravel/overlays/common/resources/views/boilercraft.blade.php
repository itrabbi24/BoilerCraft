<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-theme="{{COLOR_MODE}}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name') }}</title>
    <link rel="stylesheet" href="{{ asset('css/boilercraft-theme.css') }}">
    @verbatim
    {{STYLESHEET_LINK}}
    @endverbatim
</head>
<body class="p-6">
    <div style="max-width: 900px; margin: 2rem auto; text-align: center;">
        @verbatim
        {{LOGO_HTML}}
        @endverbatim
        <h1>{{APP_TITLE}}</h1>
        <p style="color: var(--color-text-muted);">{{APP_DESC}}</p>

        <div style="text-align: left; padding: 2rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-base); margin-top: 2rem;">
            <h3>Active Architecture:</h3>
            <ul>
                <li><strong>Framework:</strong> Laravel {{ $laravelVersion }}</li>
                <li><strong>Database connection:</strong> {{ $database }}</li>
                <li><strong>Styling:</strong> {{STYLING}}</li>
            </ul>
            <hr style="border: none; border-top: 1px solid var(--color-border); margin: 1.5rem 0;" />
            <h4>Components:</h4>
            @verbatim
            {{UI_COMPONENTS}}
            @endverbatim
        </div>
    </div>
    <script src="{{ asset('js/boilercraft-theme.js') }}"></script>
</body>
</html>
