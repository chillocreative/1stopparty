<?php
// Simple database check
try {
    $pdo = new PDO('sqlite:database/database.sqlite');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Checking existing tables...\n";
    
    $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll();
    
    foreach ($tables as $table) {
        echo "Table: " . $table['name'] . "\n";
    }

    // Check if event_categories table exists
    try {
        $result = $pdo->query("SELECT COUNT(*) FROM event_categories")->fetchColumn();
        echo "Event categories table exists with $result rows\n";
    } catch (Exception $e) {
        echo "Event categories table does not exist\n";
        
        // Create the table
        echo "Creating event_categories table...\n";
        $createTable = "
        CREATE TABLE event_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT,
            color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        
        $pdo->exec($createTable);
        echo "Event categories table created!\n";
        
        // Insert default categories
        $categories = [
            ['Program Cabang', 'Events related to branch programs and activities', '#3B82F6'],
            ['Program Wanita', 'Women\'s programs and activities', '#EC4899'],
            ['Program AMK', 'AMK programs and activities', '#10B981'],
            ['Program Ahli Majlis', 'Council member programs and activities', '#F59E0B'],
            ['Program MPKK', 'MPKK programs and activities', '#8B5CF6'],
            ['Program JPWK', 'JPWK programs and activities', '#EF4444'],
            ['Program JBPP', 'JBPP programs and activities', '#06B6D4'],
        ];
        
        foreach ($categories as $category) {
            $stmt = $pdo->prepare("INSERT INTO event_categories (name, description, color) VALUES (?, ?, ?)");
            $stmt->execute($category);
            echo "Added category: " . $category[0] . "\n";
        }
    }

    echo "Database check complete!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
