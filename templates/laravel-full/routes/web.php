<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\AuthController;

Route::get('/', [HomeController::class, 'index']);

// Authentication Routes
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register'])->name('register');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::get('/health', function () {
    return response()->json([
        'status' => 'online',
        'app' => '{{APP_TITLE}}',
        'framework' => 'Laravel',
        'php' => PHP_VERSION,
        'timestamp' => now()
    ]);
});

