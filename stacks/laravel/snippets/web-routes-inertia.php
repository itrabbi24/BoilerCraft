

// BoilerCraft landing page (Inertia), registered last so it replaces the default welcome route.
Route::get('/', fn () => \Inertia\Inertia::render('Welcome', [
    'laravelVersion' => app()->version(),
    'database' => config('database.default'),
]))->name('home');
