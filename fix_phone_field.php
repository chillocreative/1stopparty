<?php
/**
 * Emergency Phone Field Fix Script
 * Upload this file to your server root and run: php fix_phone_field.php
 * This will fix the CreateUser.jsx file directly on the server
 */

echo "=== Phone Field Fix Script ===\n\n";

// Path to the CreateUser.jsx file on server
$createUserFile = __DIR__ . '/resources/js/pages/CreateUser.jsx';

if (!file_exists($createUserFile)) {
    echo "❌ CreateUser.jsx file not found at: {$createUserFile}\n";
    echo "Please make sure you're running this from the correct directory.\n";
    exit(1);
}

echo "✓ Found CreateUser.jsx file\n";

// Read the current content
$content = file_get_contents($createUserFile);

// Check if the fix is already applied
if (strpos($content, "value.startsWith('01')") === false) {
    echo "✓ Phone field appears to be already fixed or different issue exists\n";
} else {
    echo "Applying phone field fix...\n";
    
    // Create backup
    $backupFile = $createUserFile . '.backup.' . date('Y-m-d_H-i-s');
    if (copy($createUserFile, $backupFile)) {
        echo "✓ Created backup: " . basename($backupFile) . "\n";
    }
    
    // Apply the fix
    $fixedContent = str_replace(
        "if (value.length <= 11 && (!value || value.startsWith('01'))) {",
        "if (value.length <= 11) {",
        $content
    );
    
    // Write the fixed content
    if (file_put_contents($createUserFile, $fixedContent)) {
        echo "✓ Successfully applied phone field fix\n";
        
        // Verify the fix
        $newContent = file_get_contents($createUserFile);
        if (strpos($newContent, "value.startsWith('01')") === false) {
            echo "✓ Fix verified - restrictive '01' validation removed\n";
        } else {
            echo "❌ Fix verification failed\n";
        }
    } else {
        echo "❌ Failed to write fixed content\n";
        exit(1);
    }
}

// Clear Laravel caches
echo "\nClearing Laravel caches...\n";

$cacheCommands = [
    'php artisan config:clear',
    'php artisan cache:clear', 
    'php artisan view:clear'
];

foreach ($cacheCommands as $cmd) {
    echo "Running: {$cmd}\n";
    $output = shell_exec($cmd . ' 2>&1');
    if ($output) {
        echo "  " . trim($output) . "\n";
    }
}

// Check if we need to rebuild frontend assets
echo "\nChecking frontend assets...\n";
$manifestFile = __DIR__ . '/public/build/manifest.json';
if (file_exists($manifestFile)) {
    echo "✓ Build manifest exists\n";
    
    // Try to update the timestamp to force refresh
    touch($manifestFile);
    echo "✓ Updated manifest timestamp to force refresh\n";
} else {
    echo "❌ Build manifest not found - frontend assets may need rebuilding\n";
    echo "   You may need to upload the built assets manually\n";
}

echo "\n=== Fix Complete ===\n";
echo "Next steps:\n";
echo "1. Test the Create User form\n";
echo "2. Try typing in the phone number field\n";
echo "3. If still not working, clear your browser cache (Ctrl+F5)\n";
echo "4. If problem persists, you may need to upload the built assets manually\n\n";

echo "Files modified:\n";
echo "- {$createUserFile} (main fix)\n";
if (isset($backupFile)) {
    echo "- {$backupFile} (backup created)\n";
}
echo "- Various cache files cleared\n";