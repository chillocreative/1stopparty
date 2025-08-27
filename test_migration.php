<?php
// Simple script to test database and run migrations
require_once 'vendor/autoload.php';

use Illuminate\Foundation\Application;

// Create Laravel app instance
$app = new Application(
    $_ENV['APP_BASE_PATH'] ?? dirname(__DIR__)
);

// Bootstrap the application
$app->singleton(
    Illuminate\Contracts\Http\Kernel::class,
    App\Http\Kernel::class
);

$app->singleton(
    Illuminate\Contracts\Console\Kernel::class,
    App\Console\Kernel::class
);

$app->singleton(
    Illuminate\Contracts\Debug\ExceptionHandler::class,
    App\Exceptions\Handler::class
);

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

// Try to run migrations
try {
    echo "Running migrations...\n";
    $exitCode = $kernel->call('migrate');
    echo "Migrations completed with exit code: $exitCode\n";
} catch (Exception $e) {
    echo "Error running migrations: " . $e->getMessage() . "\n";
}

// Test database connection
try {
    echo "Testing database connection...\n";
    $pdo = new PDO('sqlite:database/database.sqlite');
    echo "Database connection successful!\n";
    
    // Check if sessions table exists
    $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'");
    if ($stmt->fetch()) {
        echo "Sessions table exists\n";
    } else {
        echo "Sessions table does not exist\n";
    }
    
} catch (Exception $e) {
    echo "Database connection error: " . $e->getMessage() . "\n";
}
?>
