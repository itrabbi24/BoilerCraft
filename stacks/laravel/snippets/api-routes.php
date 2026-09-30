

// BoilerCraft token authentication (Laravel Sanctum).
Route::post('/auth/register', [\App\Http\Controllers\Api\AuthController::class, 'register']);
Route::post('/auth/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [\App\Http\Controllers\Api\AuthController::class, 'me']);
    Route::post('/auth/logout', [\App\Http\Controllers\Api\AuthController::class, 'logout']);
});
