<?php

// Simple script to run migrations and seeders
require_once 'vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;
use Database\Seeders\EventCategorySeeder;

try {
    $capsule = new Capsule;
    
    $capsule->addConnection([
        'driver' => 'sqlite',
        'database' => __DIR__ . '/database/database.sqlite',
        'prefix' => '',
    ]);

    $capsule->setAsGlobal();
    $capsule->bootEloquent();

    echo "Running event categories migration...\n";

    // Create event_categories table if it doesn't exist
    $pdo = $capsule->getConnection()->getPdo();
    
    $createCategoriesTable = "
    CREATE TABLE IF NOT EXISTS event_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    
    $pdo->exec($createCategoriesTable);
    echo "Event categories table created successfully!\n";

    // Update events table to add category_id column
    try {
        $pdo->exec("ALTER TABLE events ADD COLUMN category_id INTEGER REFERENCES event_categories(id) ON DELETE SET NULL");
        echo "Added category_id column to events table!\n";
    } catch (Exception $e) {
        echo "Category_id column may already exist: " . $e->getMessage() . "\n";
    }

    // Remove old category column if it exists
    try {
        // SQLite doesn't support DROP COLUMN directly, so we'll work around it
        echo "Note: Old 'category' column still exists but is not used.\n";
    } catch (Exception $e) {
        echo "Note about old column: " . $e->getMessage() . "\n";
    }

    echo "Running event category seeder...\n";
    
    // Run the seeder manually
    $categories = [
        ['name' => 'Program Cabang', 'description' => 'Events related to branch programs and activities', 'color' => '#3B82F6'],
        ['name' => 'Program Wanita', 'description' => 'Women\'s programs and activities', 'color' => '#EC4899'],
        ['name' => 'Program AMK', 'description' => 'AMK programs and activities', 'color' => '#10B981'],
        ['name' => 'Program Ahli Majlis', 'description' => 'Council member programs and activities', 'color' => '#F59E0B'],
        ['name' => 'Program MPKK', 'description' => 'MPKK programs and activities', 'color' => '#8B5CF6'],
        ['name' => 'Program JPWK', 'description' => 'JPWK programs and activities', 'color' => '#EF4444'],
        ['name' => 'Program JBPP', 'description' => 'JBPP programs and activities', 'color' => '#06B6D4'],
    ];

    foreach ($categories as $category) {
        $stmt = $pdo->prepare("INSERT OR IGNORE INTO event_categories (name, description, color) VALUES (?, ?, ?)");
        $stmt->execute([$category['name'], $category['description'], $category['color']]);
    }

    echo "Event categories seeded successfully!\n";
    echo "Setup completed!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
