<?php
/**
 * Add Missing Routes Script
 * This script adds the missing finance routes to routes/api.php if they're not there
 * Usage: php add_missing_routes.php
 */

echo "=== Add Missing Routes Script ===\n\n";

$apiRoutesFile = __DIR__ . '/routes/api.php';

if (!file_exists($apiRoutesFile)) {
    echo "❌ routes/api.php file not found!\n";
    exit(1);
}

echo "Reading routes/api.php file...\n";
$content = file_get_contents($apiRoutesFile);

// Check if routes already exist
$hasViewFile = strpos($content, 'view-file') !== false;
$hasDownloadFile = strpos($content, 'download-file') !== false;

echo "Current status:\n";
echo "- view-file route: " . ($hasViewFile ? "✓ Present" : "❌ Missing") . "\n";
echo "- download-file route: " . ($hasDownloadFile ? "✓ Present" : "❌ Missing") . "\n\n";

if ($hasViewFile && $hasDownloadFile) {
    echo "✓ Both routes are already present. No changes needed.\n";
    exit(0);
}

// Find the finance routes section
$lines = explode("\n", $content);
$financeRouteLines = [];
$insertAfterLine = -1;

foreach ($lines as $index => $line) {
    if (strpos($line, 'Route::delete') !== false && strpos($line, 'finances/{finance}') !== false) {
        $insertAfterLine = $index;
        break;
    }
}

if ($insertAfterLine === -1) {
    // Try to find any finance route
    foreach ($lines as $index => $line) {
        if (strpos($line, 'finances/{finance}') !== false) {
            $insertAfterLine = $index;
        }
    }
}

if ($insertAfterLine === -1) {
    echo "❌ Could not find where to insert the routes.\n";
    echo "Please manually add these lines to your routes/api.php file:\n\n";
    echo "Route::get('finances/{finance}/view-file', [App\\Http\\Controllers\\FinanceController::class, 'viewFile']);\n";
    echo "Route::get('finances/{finance}/download-file', [App\\Http\\Controllers\\FinanceController::class, 'downloadFile']);\n\n";
    exit(1);
}

echo "Found insertion point at line " . ($insertAfterLine + 1) . "\n";

// Prepare the new routes to add
$newRoutes = [];
if (!$hasViewFile) {
    $newRoutes[] = "    Route::get('finances/{finance}/view-file', [App\\Http\\Controllers\\FinanceController::class, 'viewFile']);";
}
if (!$hasDownloadFile) {
    $newRoutes[] = "    Route::get('finances/{finance}/download-file', [App\\Http\\Controllers\\FinanceController::class, 'downloadFile']);";
}

// Insert the new routes
$newLines = array_slice($lines, 0, $insertAfterLine + 1);
$newLines = array_merge($newLines, $newRoutes);
$newLines = array_merge($newLines, array_slice($lines, $insertAfterLine + 1));

$newContent = implode("\n", $newLines);

// Backup the original file
$backupFile = $apiRoutesFile . '.backup.' . date('Y-m-d_H-i-s');
if (copy($apiRoutesFile, $backupFile)) {
    echo "✓ Created backup: " . basename($backupFile) . "\n";
} else {
    echo "⚠️  Could not create backup file\n";
}

// Write the new content
if (file_put_contents($apiRoutesFile, $newContent)) {
    echo "✓ Successfully added missing routes to routes/api.php\n\n";
    
    echo "Added routes:\n";
    foreach ($newRoutes as $route) {
        echo "  " . trim($route) . "\n";
    }
    
    echo "\nNext steps:\n";
    echo "1. Run: php artisan route:clear\n";
    echo "2. Run: php artisan route:cache\n";
    echo "3. Test: php artisan route:list --path=api/finances\n";
    
} else {
    echo "❌ Failed to write to routes/api.php file\n";
    echo "Please check file permissions or add the routes manually.\n";
}

echo "\n=== Script Complete ===\n";