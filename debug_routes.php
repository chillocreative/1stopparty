<?php
/**
 * Route Debugging Script
 * This script helps diagnose route registration issues on production
 * Usage: php debug_routes.php
 */

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Route Debugging Script ===\n\n";

// Check if routes/api.php file exists and content
echo "1. Checking routes/api.php file:\n";
$apiRoutesFile = __DIR__ . '/routes/api.php';
if (file_exists($apiRoutesFile)) {
    echo "   ✓ File exists: {$apiRoutesFile}\n";
    
    // Check file content for our routes
    $content = file_get_contents($apiRoutesFile);
    if (strpos($content, 'view-file') !== false) {
        echo "   ✓ Contains view-file route\n";
    } else {
        echo "   ❌ Missing view-file route\n";
    }
    
    if (strpos($content, 'download-file') !== false) {
        echo "   ✓ Contains download-file route\n";
    } else {
        echo "   ❌ Missing download-file route\n";
    }
    
    // Show relevant finance routes from file
    echo "\n   Finance routes in file:\n";
    $lines = explode("\n", $content);
    foreach ($lines as $lineNum => $line) {
        if (stripos($line, 'finance') !== false && stripos($line, 'Route::') !== false) {
            echo "   " . ($lineNum + 1) . ": " . trim($line) . "\n";
        }
    }
} else {
    echo "   ❌ File not found: {$apiRoutesFile}\n";
}

echo "\n2. Checking Laravel route registration:\n";

try {
    // Get all registered routes
    $routes = app('router')->getRoutes();
    $financeRoutes = [];
    
    foreach ($routes as $route) {
        $uri = $route->uri();
        if (strpos($uri, 'finance') !== false) {
            $financeRoutes[] = [
                'method' => implode('|', $route->methods()),
                'uri' => $uri,
                'name' => $route->getName() ?: 'unnamed',
                'action' => $route->getActionName()
            ];
        }
    }
    
    if (empty($financeRoutes)) {
        echo "   ❌ No finance routes registered at all!\n";
    } else {
        echo "   ✓ Found " . count($financeRoutes) . " finance routes:\n";
        foreach ($financeRoutes as $route) {
            echo "      {$route['method']} {$route['uri']} -> {$route['action']}\n";
        }
        
        // Check specifically for our new routes
        $hasViewFile = false;
        $hasDownloadFile = false;
        
        foreach ($financeRoutes as $route) {
            if (strpos($route['uri'], 'view-file') !== false) {
                $hasViewFile = true;
            }
            if (strpos($route['uri'], 'download-file') !== false) {
                $hasDownloadFile = true;
            }
        }
        
        echo "\n   Specific route check:\n";
        echo "   View-file route: " . ($hasViewFile ? "✓ Found" : "❌ Missing") . "\n";
        echo "   Download-file route: " . ($hasDownloadFile ? "✓ Found" : "❌ Missing") . "\n";
    }
    
} catch (Exception $e) {
    echo "   ❌ Error checking routes: " . $e->getMessage() . "\n";
}

echo "\n3. Checking controller methods:\n";
$controllerFile = __DIR__ . '/app/Http/Controllers/FinanceController.php';
if (file_exists($controllerFile)) {
    echo "   ✓ FinanceController file exists\n";
    
    $controllerContent = file_get_contents($controllerFile);
    
    if (strpos($controllerContent, 'function viewFile') !== false) {
        echo "   ✓ viewFile method exists\n";
    } else {
        echo "   ❌ viewFile method missing\n";
    }
    
    if (strpos($controllerContent, 'function downloadFile') !== false) {
        echo "   ✓ downloadFile method exists\n";
    } else {
        echo "   ❌ downloadFile method missing\n";
    }
} else {
    echo "   ❌ FinanceController file not found\n";
}

echo "\n4. Cache and Config Status:\n";
$configCached = file_exists('bootstrap/cache/config.php');
$routesCached = file_exists('bootstrap/cache/routes.php');

echo "   Config cached: " . ($configCached ? "Yes" : "No") . "\n";
echo "   Routes cached: " . ($routesCached ? "Yes" : "No") . "\n";

if ($routesCached) {
    echo "   ⚠️  Routes are cached - this might be the issue!\n";
}

echo "\n=== Recommended Actions ===\n";

if (strpos(file_get_contents($apiRoutesFile), 'view-file') === false) {
    echo "1. ❌ Your routes/api.php file is missing the new routes!\n";
    echo "   → Upload the correct routes/api.php file from your repository\n\n";
} else {
    echo "1. ✓ Routes file contains the correct routes\n\n";
}

if ($routesCached) {
    echo "2. ❌ Clear route cache immediately:\n";
    echo "   → Run: php artisan route:clear\n";
    echo "   → Then: php artisan route:cache\n\n";
}

echo "3. Manual route clearing commands to run:\n";
echo "   php artisan config:clear\n";
echo "   php artisan route:clear\n";
echo "   php artisan cache:clear\n";
echo "   php artisan config:cache\n";
echo "   php artisan route:cache\n\n";

echo "4. If routes still don't work, try:\n";
echo "   rm bootstrap/cache/routes.php\n";
echo "   rm bootstrap/cache/config.php\n";
echo "   php artisan route:list --path=api/finances\n\n";

echo "=== Debug Complete ===\n";