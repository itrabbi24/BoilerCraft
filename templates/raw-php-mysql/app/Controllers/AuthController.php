<?php
namespace App\Controllers;

use App\Models\User;
use App\Config\Auth;

class AuthController {
    public function showLogin(): void {
        require __DIR__ . '/../Views/auth/login.php';
    }

    public function login(): void {
        header('Content-Type: application/json');
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true) ?: $_POST;

        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        $userModel = new User();
        $user = $userModel->findByEmail($email);

        if ($user && password_verify($password, $user['password'])) {
            Auth::login($user);
            echo json_encode(['success' => true, 'redirect' => '/dashboard']);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid email or password']);
        }
    }

    public function showRegister(): void {
        require __DIR__ . '/../Views/auth/register.php';
    }

    public function register(): void {
        header('Content-Type: application/json');
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true) ?: $_POST;

        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';
        $role = $data['role'] ?? 'user';

        if (empty($name) || empty($email) || strlen($password) < 6) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Name, valid email and min 6 char password required.']);
            return;
        }

        $userModel = new User();
        if ($userModel->findByEmail($email)) {
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => 'Email already registered.']);
            return;
        }

        $hashed = password_hash($password, PASSWORD_BCRYPT);
        $userModel->createWithPassword($name, $email, $hashed, $role);
        
        $newUser = $userModel->findByEmail($email);
        Auth::login($newUser);

        echo json_encode(['success' => true, 'redirect' => '/dashboard']);
    }

    public function logout(): void {
        Auth::logout();
        header('Location: /login');
        exit;
    }
}
