<?php
// Simple migration runner
$pdo = new PDO('sqlite:database/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "Creating sessions table if not exists...\n";

// Create sessions table manually if it doesn't exist
$sessionTableSQL = "
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    payload TEXT NOT NULL,
    last_activity INTEGER NOT NULL
)";

try {
    $pdo->exec($sessionTableSQL);
    echo "Sessions table created successfully!\n";
} catch (PDOException $e) {
    echo "Error creating sessions table: " . $e->getMessage() . "\n";
}

// Check if meetings table has all required columns
echo "Checking meetings table structure...\n";

try {
    $pdo->query("SELECT time FROM meetings LIMIT 1");
    echo "Meetings table has 'time' column.\n";
} catch (PDOException $e) {
    echo "Adding 'time' column to meetings table...\n";
    try {
        $pdo->exec("ALTER TABLE meetings ADD COLUMN time TIME NULL");
        echo "'time' column added successfully.\n";
    } catch (PDOException $e2) {
        echo "Error adding time column: " . $e2->getMessage() . "\n";
    }
}

// Check for minit_mesyuarat_file column
try {
    $pdo->query("SELECT minit_mesyuarat_file FROM meetings LIMIT 1");
    echo "Meetings table has 'minit_mesyuarat_file' column.\n";
} catch (PDOException $e) {
    echo "Adding 'minit_mesyuarat_file' column to meetings table...\n";
    try {
        $pdo->exec("ALTER TABLE meetings ADD COLUMN minit_mesyuarat_file VARCHAR(255) NULL");
        echo "'minit_mesyuarat_file' column added successfully.\n";
    } catch (PDOException $e2) {
        echo "Error adding minit_mesyuarat_file column: " . $e2->getMessage() . "\n";
    }
}

echo "Database setup completed!\n";
?>
