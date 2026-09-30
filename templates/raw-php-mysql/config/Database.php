<?php
namespace App\Config;

use PDO;
use PDOException;

class Database {
    private static ?PDO $instance = null;

    /**
     * Get Singleton PDO connection with multi-driver support:
     * - MySQL / MariaDB (utf8mb4)
     * - MSSQL (sqlsrv / dblib)
     * - PostgreSQL (pgsql)
     * - SQLite (zero-config local file)
     */
    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dbType = strtolower(getenv('DB_CONNECTION') ?: '{{DB_TYPE}}');
            $host   = getenv('DB_HOST') ?: '127.0.0.1';
            $dbname = getenv('DB_NAME') ?: getenv('DB_DATABASE') ?: '{{DB_NAME}}';
            $user   = getenv('DB_USER') ?: getenv('DB_USERNAME') ?: 'root';
            $pass   = getenv('DB_PASS') ?: getenv('DB_PASSWORD') ?: '';
            
            $commonOptions = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
                switch ($dbType) {
                    case 'mssql':
                    case 'sqlsrv':
                        $port = getenv('DB_PORT') ?: '1433';
                        // Checks if sqlsrv driver exists, else fallback to dblib
                        if (in_array('sqlsrv', PDO::getAvailableDrivers())) {
                            $dsn = "sqlsrv:Server={$host},{$port};Database={$dbname};TrustServerCertificate=true";
                        } else {
                            $dsn = "dblib:host={$host}:{$port};dbname={$dbname}";
                        }
                        self::$instance = new PDO($dsn, $user, $pass, $commonOptions);
                        break;

                    case 'pgsql':
                    case 'postgres':
                    case 'postgresql':
                        $port = getenv('DB_PORT') ?: '5432';
                        $dsn = "pgsql:host={$host};port={$port};dbname={$dbname}";
                        self::$instance = new PDO($dsn, $user, $pass, $commonOptions);
                        break;

                    case 'sqlite':
                        $sqlitePath = getenv('DB_PATH') ?: __DIR__ . '/../../database.sqlite';
                        if (!file_exists($sqlitePath)) {
                            touch($sqlitePath);
                        }
                        $dsn = "sqlite:{$sqlitePath}";
                        self::$instance = new PDO($dsn, null, null, $commonOptions);
                        break;

                    case 'mysql':
                    case 'mariadb':
                    default:
                        $port = getenv('DB_PORT') ?: '3306';
                        $charset = 'utf8mb4';
                        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";
                        self::$instance = new PDO($dsn, $user, $pass, $commonOptions);
                        break;
                }
            } catch (PDOException $e) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'error' => "Database Connection Failed [Engine: {$dbType}]",
                    'message' => $e->getMessage()
                ]);
                exit;
            }
        }
        return self::$instance;
    }

    /**
     * Helper to run parameterized queries safely
     */
    public static function query(string $sql, array $params = []): array {
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Helper for INSERT / UPDATE / DELETE
     */
    public static function execute(string $sql, array $params = []): bool {
        $stmt = self::getConnection()->prepare($sql);
        return $stmt->execute($params);
    }
}
