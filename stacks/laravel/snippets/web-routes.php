

// BoilerCraft landing page (registered last, so it replaces the default welcome route).
Route::get('/', [\App\Http\Controllers\BoilerCraftController::class, 'index'])->name('home');
