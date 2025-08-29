<?php
/**
 * Production Storage Fix Script
 * Run this on the production server to diagnose and fix storage issues
 * Usage: php fix_storage_production.php
 */

echo "=== 1StopParty Storage Diagnostic Tool ===\n\n";

// Check Laravel paths
echo "1. Checking Laravel paths:\n";
echo "   Base Path: " . realpath(__DIR__) . "\n";
echo "   Public Path: " . realpath(__DIR__ . '/public') . "\n";
echo "   Storage Path: " . realpath(__DIR__ . '/storage/app/public') . "\n\n";

// Check if storage symlink exists
$symlinkPath = __DIR__ . '/public/storage';
echo "2. Checking storage symlink:\n";
echo "   Symlink Path: {$symlinkPath}\n";

if (file_exists($symlinkPath)) {
    if (is_link($symlinkPath)) {
        echo "   Status: Symlink exists\n";
        echo "   Target: " . readlink($symlinkPath) . "\n";
        echo "   Target exists: " . (file_exists(readlink($symlinkPath)) ? 'Yes' : 'No') . "\n";
    } else {
        echo "   Status: Path exists but is not a symlink\n";
    }
} else {
    echo "   Status: Symlink does not exist\n";
}

// Check storage directory
$storagePath = __DIR__ . '/storage/app/public';
echo "\n3. Checking storage directory:\n";
echo "   Storage exists: " . (file_exists($storagePath) ? 'Yes' : 'No') . "\n";
echo "   Storage writable: " . (is_writable($storagePath) ? 'Yes' : 'No') . "\n";

if (file_exists($storagePath)) {
    echo "   Storage contents:\n";
    $contents = scandir($storagePath);
    foreach ($contents as $item) {
        if ($item !== '.' && $item !== '..') {
            echo "     - {$item}\n";
        }
    }
}

// Check profile_images directory
$profileImagesPath = $storagePath . '/profile_images';
echo "\n4. Checking profile_images directory:\n";
echo "   Profile images dir exists: " . (file_exists($profileImagesPath) ? 'Yes' : 'No') . "\n";

if (file_exists($profileImagesPath)) {
    echo "   Profile images writable: " . (is_writable($profileImagesPath) ? 'Yes' : 'No') . "\n";
    echo "   Profile images contents:\n";
    $images = scandir($profileImagesPath);
    foreach ($images as $image) {
        if ($image !== '.' && $image !== '..') {
            echo "     - {$image}\n";
        }
    }
}

// Check finance_files directory
$financeFilesPath = $storagePath . '/finance_files';
echo "\n5. Checking finance_files directory:\n";
echo "   Finance files dir exists: " . (file_exists($financeFilesPath) ? 'Yes' : 'No') . "\n";

if (file_exists($financeFilesPath)) {
    echo "   Finance files writable: " . (is_writable($financeFilesPath) ? 'Yes' : 'No') . "\n";
    echo "   Finance files contents:\n";
    $files = scandir($financeFilesPath);
    foreach ($files as $file) {
        if ($file !== '.' && $file !== '..') {
            echo "     - {$file}\n";
        }
    }
}

// Attempt to create symlink if it doesn't exist
echo "\n6. Attempting fixes:\n";

if (!file_exists($symlinkPath)) {
    echo "   Creating storage symlink...\n";
    $targetPath = realpath(__DIR__ . '/storage/app/public');
    
    if (symlink($targetPath, $symlinkPath)) {
        echo "   ✓ Symlink created successfully\n";
    } else {
        echo "   ✗ Failed to create symlink\n";
        
        // Alternative: create .htaccess redirect
        echo "   Creating .htaccess redirect as fallback...\n";
        $htaccessPath = __DIR__ . '/public/.htaccess_storage_fix';
        $htaccessContent = "# Storage access fix for profile images\n";
        $htaccessContent .= "RewriteEngine On\n";
        $htaccessContent .= "RewriteRule ^storage/profile_images/(.*)$ ../storage/app/public/profile_images/$1 [L]\n";
        
        if (file_put_contents($htaccessPath, $htaccessContent)) {
            echo "   ✓ .htaccess redirect created at {$htaccessPath}\n";
            echo "   Please add these rules to your main .htaccess file\n";
        }
    }
}

// Create profile_images directory if it doesn't exist
if (!file_exists($profileImagesPath)) {
    echo "   Creating profile_images directory...\n";
    if (mkdir($profileImagesPath, 0755, true)) {
        echo "   ✓ Profile images directory created\n";
    } else {
        echo "   ✗ Failed to create profile images directory\n";
    }
}

// Create finance_files directory if it doesn't exist
if (!file_exists($financeFilesPath)) {
    echo "   Creating finance_files directory...\n";
    if (mkdir($financeFilesPath, 0755, true)) {
        echo "   ✓ Finance files directory created\n";
    } else {
        echo "   ✗ Failed to create finance files directory\n";
    }
}

echo "\n=== Diagnostic Complete ===\n";
echo "If issues persist, contact your hosting provider about symlink support.\n";