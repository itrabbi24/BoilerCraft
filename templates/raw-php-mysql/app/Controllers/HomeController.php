<?php
namespace App\Controllers;

use App\Models\User;

class HomeController {
    public function index(): void {
        $appName = "{{APP_TITLE}}";
        $appDesc = "{{APP_DESC}}";
        $author = "{{AUTHOR}}";
        
        $userModel = new User();
        $users = $userModel->all();

        require __DIR__ . '/../Views/home.php';
    }

    /**
     * AJAX Endpoint for User Registration
     */
    public function apiCreateUser(): void {
        header('Content-Type: application/json');
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true) ?: $_POST;

        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');

        if (empty($name) || empty($email)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Name and Email are required.']);
            return;
        }

        try {
            $userModel = new User();
            $userModel->create($name, $email);
            echo json_encode(['success' => true, 'message' => 'User created via AJAX successfully!']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    /**
     * AJAX Endpoint for fetching Users list
     */
    public function apiGetUsers(): void {
        header('Content-Type: application/json');
        $userModel = new User();
        $users = $userModel->all();
        echo json_encode(['success' => true, 'data' => $users]);
    }

    public function apiHealth(): void {
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'online',
            'platform' => 'Raw PHP MVC',
            'database' => 'MySQL PDO',
            'ajax_support' => true,
            'timestamp' => time()
        ]);
    }
}
