<?php
namespace App\Models;

use App\Config\QueryBuilder;
use App\Config\Database;

class User {
    protected string $table = 'users';

    public function __construct() {
        $this->initSchema();
    }

    private function initSchema(): void {
        $sql = "CREATE TABLE IF NOT EXISTS {$this->table} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            password VARCHAR(255) NULL,
            role VARCHAR(50) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=INNODB;";
        Database::execute($sql);
    }

    public function all(): array {
        return QueryBuilder::table($this->table)
            ->orderBy('id', 'DESC')
            ->limit(20)
            ->get();
    }

    public function find(int $id): ?array {
        return QueryBuilder::table($this->table)
            ->where('id', $id)
            ->first();
    }

    public function findByEmail(string $email): ?array {
        return QueryBuilder::table($this->table)
            ->where('email', $email)
            ->first();
    }

    public function createWithPassword(string $name, string $email, string $passwordHash, string $role = 'user'): bool {
        return QueryBuilder::table($this->table)->insert([
            'name' => $name,
            'email' => $email,
            'password' => $passwordHash,
            'role' => $role
        ]);
    }

    public function create(string $name, string $email): bool {
        return QueryBuilder::table($this->table)->insert([
            'name' => $name,
            'email' => $email
        ]);
    }
}
