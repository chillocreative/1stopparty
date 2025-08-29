<?php
/**
 * Production Route Fix Script
 * This script aggressively clears all caches and rebuilds routes
 * Usage: php fix_routes_production.php
 */

echo "=== Production Route Fix Script ===\n\n";

// Function to run command with error handling
function runCommand($command, $description) {
    echo "Running: {$description}\n";
    echo "Command: {$command}\n";
    
    $output = [];
    $returnCode = 0;
    
    exec($command . ' 2>&1', $output, $returnCode);
    
    foreach ($output as $line) {
        echo "  {$line}\n";
    }
    
    if ($returnCode === 0) {
        echo "✓ Success\n\n";
        return true;
    } else {
        echo "❌ Failed (return code: {$returnCode})\n\n";
        return false;
    }
}

// Function to find PHP binary
function findPhpBinary() {
    $phpPaths = [
        '/usr/bin/php',
        '/usr/local/bin/php', 
        '/opt/cpanel/ea-php81/root/usr/bin/php',
        '/opt/cpanel/ea-php82/root/usr/bin/php',
        '/opt/cpanel/ea-php83/root/usr/bin/php',
        'php'
    ];
    
    foreach ($phpPaths as $path) {
        $test = shell_exec("which {$path} 2>/dev/null");
        if (!empty($test) || $path === 'php') {
            return $path;
        }
    }
    
    return 'php';
}

$php = findPhpBinary();
echo "Using PHP: {$php}\n\n";

// Step 1: Verify routes file
echo "=== Step 1: Verifying routes/api.php ===\n";
$apiRoutesFile = __DIR__ . '/routes/api.php';
if (file_exists($apiRoutesFile)) {
    $content = file_get_contents($apiRoutesFile);
    if (strpos($content, 'view-file') !== false && strpos($content, 'download-file') !== false) {
        echo "✓ Routes file contains new finance routes\n\n";
    } else {
        echo "❌ Routes file is missing the new finance routes!\n";
        echo "Please upload the correct routes/api.php file first.\n\n";
        echo "The file should contain these lines:\n";
        echo "Route::get('finances/{finance}/view-file', [App\\Http\\Controllers\\FinanceController::class, 'viewFile']);\n";
        echo "Route::get('finances/{finance}/download-file', [App\\Http\\Controllers\\FinanceController::class, 'downloadFile']);\n\n";
        exit(1);
    }
} else {
    echo "❌ routes/api.php file not found!\n";
    exit(1);
}

// Step 2: Nuclear cache clear
echo "=== Step 2: Nuclear Cache Clear ===\n";

// Delete cache files manually
$cacheFiles = [
    'bootstrap/cache/routes.php',
    'bootstrap/cache/config.php',
    'bootstrap/cache/services.php',
    'bootstrap/cache/packages.php'
];

echo "Manually deleting cache files:\n";
foreach ($cacheFiles as $file) {
    if (file_exists($file)) {
        if (unlink($file)) {
            echo "✓ Deleted: {$file}\n";
        } else {
            echo "❌ Failed to delete: {$file}\n";
        }
    } else {
        echo "○ Not found: {$file}\n";
    }
}
echo "\n";

// Clear all Laravel caches
runCommand("{$php} artisan config:clear", "Clear config cache");
runCommand("{$php} artisan route:clear", "Clear route cache");
runCommand("{$php} artisan cache:clear", "Clear application cache");
runCommand("{$php} artisan view:clear", "Clear view cache");

// Step 3: Rebuild caches
echo "=== Step 3: Rebuilding Caches ===\n";
runCommand("{$php} artisan config:cache", "Cache config");

// Don't cache routes immediately - let's test first
echo "Skipping route caching for now - will test routes first\n\n";

// Step 4: Test route registration
echo "=== Step 4: Testing Route Registration ===\n";
runCommand("{$php} artisan route:list --path=api/finances", "List finance routes");

// Run our debug script
if (file_exists('debug_routes.php')) {
    echo "=== Step 5: Running Route Debug ===\n";
    runCommand("{$php} debug_routes.php", "Debug route registration");
} else {
    echo "=== Step 5: Manual Route Check ===\n";
    echo "debug_routes.php not found, checking manually...\n";
    
    $routeList = shell_exec("{$php} artisan route:list --path=api/finances 2>&1");
    if (strpos($routeList, 'view-file') !== false) {
        echo "✓ view-file route found\n";
    } else {
        echo "❌ view-file route missing\n";
    }
    
    if (strpos($routeList, 'download-file') !== false) {
        echo "✓ download-file route found\n";
    } else {
        echo "❌ download-file route missing\n";
    }
    echo "\n";
}

// Step 6: Final cache rebuild
echo "=== Step 6: Final Cache Rebuild ===\n";
$routeList = shell_exec("{$php} artisan route:list --path=api/finances 2>&1");
if (strpos($routeList, 'view-file') !== false && strpos($routeList, 'download-file') !== false) {
    echo "✓ Routes are working! Caching them now...\n";
    runCommand("{$php} artisan route:cache", "Cache routes");
} else {
    echo "❌ Routes still not working. NOT caching routes.\n";
    echo "Please check the following:\n";
    echo "1. Ensure routes/api.php contains the new routes\n";
    echo "2. Ensure app/Http/Controllers/FinanceController.php has viewFile and downloadFile methods\n";
    echo "3. Try running: {$php} artisan route:list | grep finance\n";
}

echo "\n=== Fix Complete ===\n";
echo "Test your finance routes at:\n";
echo "- https://sys.keadilankb.com/api/finances\n";
echo "- https://sys.keadilankb.com/api/finances/[ID]/view-file\n";