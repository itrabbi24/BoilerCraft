<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\HomeController;

Route::get('/', [HomeController::class, 'index']);

Route::get('/health', function () {
    return response()->json([
        'status' => 'online',
        'app' => '{{APP_TITLE}}',
        'framework' => 'Laravel 11',
        'php' => PHP_VERSION,
        'timestamp' => now()
    ]);
});
