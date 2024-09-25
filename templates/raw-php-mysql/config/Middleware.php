<?php
namespace App\Config;

class Middleware {
    /**
     * Authentication Guard (Blocks guest users)
     */
    public static function auth(): void {
        if (!Auth::check()) {
            if (self::isAjax()) {
                http_response_code(401);
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'error' => 'Unauthorized. Please login.']);
                exit;
            }
            header('Location: /login');
            exit;
        }
    }

    /**
     * Guest Guard (Redirects logged-in users away from login/register)
     */
    public static function guest(): void {
        if (Auth::check()) {
            header('Location: /dashboard');
            exit;
        }
    }

    /**
     * Role-based Authorization Guard (e.g. 'admin', 'moderator')
     */
    public static function role(string|array $roles): void {
        self::auth(); // Must be logged in first

        if (!Auth::hasRole($roles)) {
            if (self::isAjax()) {
                http_response_code(403);
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'error' => 'Forbidden. You lack sufficient permissions.']);
                exit;
            }
            http_response_code(403);
            die("<h1>403 Forbidden</h1><p>You do not have permission to access this area.</p>");
        }
    }

    private static function isAjax(): bool {
        return (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest')
            || (isset($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json'));
    }
}
