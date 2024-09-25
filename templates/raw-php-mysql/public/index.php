<?php
// Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../app/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);
    if (strpos($relative_class, 'Config\\') === 0) {
        $file = __DIR__ . '/../' . str_replace('\\', '/', $relative_class) . '.php';
    } else {
        $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    }

    if (file_exists($file)) {
        require $file;
    }
});

use App\Config\Env;
use App\Config\Router;
use App\Config\Middleware;
use App\Controllers\HomeController;
use App\Controllers\AuthController;

Env::load(__DIR__ . '/../.env');

$router = new Router();

// Public Routes
$router->get('/', [HomeController::class, 'index']);
$router->get('/login', [AuthController::class, 'showLogin']);
$router->get('/register', [AuthController::class, 'showRegister']);
$router->get('/logout', [AuthController::class, 'logout']);

// AJAX Auth Endpoints
$router->post('/api/login', [AuthController::class, 'login']);
$router->post('/api/register', [AuthController::class, 'register']);
$router->get('/api/health', [HomeController::class, 'apiHealth']);

// Protected Routes (Guarded by Middleware)
$router->get('/dashboard', function() {
    Middleware::auth(); // Protect route: must be logged in
    require __DIR__ . '/../app/Views/dashboard.php';
});

$router->get('/admin', function() {
    Middleware::role('admin'); // Protect route: only admin role allowed
    require __DIR__ . '/../app/Views/dashboard.php';
});

// Dispatch request
$router->dispatch();
