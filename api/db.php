<?php
/**
 * ATELIER E-Commerce - Database Connection Module
 * Handles PDO MySQL connection with fallback to Hostinger internal and external hosts.
 */

if (file_exists(__DIR__ . '/config.php')) {
    require_once __DIR__ . '/config.php';
}

if (!defined('DB_HOST')) define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
if (!defined('DB_NAME')) define('DB_NAME', getenv('DB_NAME') ?: 'u895506237_deept');
if (!defined('DB_USER')) define('DB_USER', getenv('DB_USER') ?: 'u895506237_deept');
if (!defined('DB_PASS')) define('DB_PASS', getenv('DB_PASS') ?: '>gVh1Lz;8');

function getDbConnection() {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $hosts = [DB_HOST, '127.0.0.1', 'srv898.hstgr.io'];
    $lastException = null;

    foreach ($hosts as $host) {
        try {
            $dsn = "mysql:host={$host};dbname=" . DB_NAME . ";charset=utf8mb4";
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 4
            ]);
            return $pdo;
        } catch (PDOException $e) {
            $lastException = $e;
        }
    }

    throw $lastException;
}

function initDbTables($pdo) {
    // 1. Orders table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `orders` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `order_number` VARCHAR(50) NOT NULL UNIQUE,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `customer_first_name` VARCHAR(100),
            `customer_last_name` VARCHAR(100),
            `customer_email` VARCHAR(150),
            `customer_phone` VARCHAR(50),
            `shipping_address` TEXT,
            `shipping_apartment` VARCHAR(100),
            `shipping_city` VARCHAR(100),
            `shipping_postal` VARCHAR(20),
            `shipping_country` VARCHAR(50) DEFAULT 'Maroc',
            `payment_method` VARCHAR(100) DEFAULT 'Paiement à la livraison (COD)',
            `subtotal` DECIMAL(10,2) DEFAULT 0,
            `discount` DECIMAL(10,2) DEFAULT 0,
            `shipping_cost` DECIMAL(10,2) DEFAULT 0,
            `total` DECIMAL(10,2) NOT NULL,
            `order_note` TEXT,
            `status` VARCHAR(30) DEFAULT 'pending',
            `items_json` LONGTEXT,
            INDEX (`status`),
            INDEX (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 2. Newsletter subscribers
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `email` VARCHAR(191) NOT NULL UNIQUE,
            `subscribed_at` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 3. Contact messages
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `contact_messages` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(100) NOT NULL,
            `email` VARCHAR(150) NOT NULL,
            `phone` VARCHAR(50),
            `subject` VARCHAR(150),
            `message` TEXT NOT NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `status` VARCHAR(20) DEFAULT 'unread'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 4. Products Master Storage (Optional DB sync)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `catalog_products` (
            `id` VARCHAR(100) PRIMARY KEY,
            `name` VARCHAR(200) NOT NULL,
            `slug` VARCHAR(200) NOT NULL,
            `category` VARCHAR(100) DEFAULT 't-shirts',
            `price` INT NOT NULL,
            `data_json` LONGTEXT NOT NULL,
            `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
}
