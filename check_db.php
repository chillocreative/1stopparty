<?php
// Simple database check script
try {
    $pdo = new PDO('sqlite:database/database.sqlite');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to SQLite database successfully!\n\n";
    
    // Get all tables
    $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Existing tables:\n";
    foreach ($tables as $table) {
        echo "- $table\n";
    }
    
    // Check migrations table
    if (in_array('migrations', $tables)) {
        echo "\nMigration records:\n";
        $stmt = $pdo->query("SELECT migration FROM migrations ORDER BY batch");
        $migrations = $stmt->fetchAll(PDO::FETCH_COLUMN);
        foreach ($migrations as $migration) {
            echo "- $migration\n";
        }
    }
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
}
?>
