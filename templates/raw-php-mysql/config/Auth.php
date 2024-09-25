<?php
namespace App\Config;

class Auth {
    public static function init(): void {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public static function login(array $user): void {
        self::init();
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_role'] = $user['role'] ?? 'user';
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_email'] = $user['email'];
    }

    public static function check(): bool {
        self::init();
        return isset($_SESSION['user_id']);
    }

    public static function user(): ?array {
        self::init();
        if (!self::check()) return null;
        return [
            'id' => $_SESSION['user_id'],
            'name' => $_SESSION['user_name'],
            'email' => $_SESSION['user_email'],
            'role' => $_SESSION['user_role']
        ];
    }

    public static function id(): ?int {
        self::init();
        return $_SESSION['user_id'] ?? null;
    }

    public static function hasRole(string|array $roles): bool {
        self::init();
        if (!self::check()) return false;
        $userRole = $_SESSION['user_role'] ?? 'user';
        if (is_array($roles)) {
            return in_array($userRole, $roles);
        }
        return $userRole === $roles;
    }

    public static function logout(): void {
        self::init();
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
    }
}
