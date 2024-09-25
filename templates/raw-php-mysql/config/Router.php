<?php
namespace App\Config;

class Router {
    private array $routes = [];

    public function get(string $path, callable|array $handler): void {
        $this->routes['GET'][$path] = $handler;
    }

    public function post(string $path, callable|array $handler): void {
        $this->routes['POST'][$path] = $handler;
    }

    public function dispatch(): void {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        if (isset($this->routes[$method][$uri])) {
            $handler = $this->routes[$method][$uri];
            if (is_callable($handler)) {
                call_user_func($handler);
            } elseif (is_array($handler)) {
                [$class, $action] = $handler;
                $controller = new $class();
                $controller->$action();
            }
        } else {
            http_response_code(404);
            require __DIR__ . '/../app/Views/404.php';
        }
    }
}
