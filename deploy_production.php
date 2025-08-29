<?php
/**
 * Production Deployment Script
 * Run this script on your production server after uploading files
 * Usage: php deploy_production.php
 */

echo "=== 1StopParty Production Deployment ===\n\n";

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

// Function to check if command exists
function commandExists($command) {
    $test = shell_exec("which {$command} 2>/dev/null");
    return !empty($test);
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
        if (commandExists($path) || $path === 'php') {
            return $path;
        }
    }
    
    return 'php';
}

// Function to find Composer binary
function findComposerBinary() {
    $composerPaths = [
        '/opt/cpanel/composer/bin/composer',
        '/usr/local/bin/composer',
        '/usr/bin/composer',
        'composer'
    ];
    
    foreach ($composerPaths as $path) {
        if (commandExists($path)) {
            return $path;
        }
    }
    
    return 'composer';
}

$php = findPhpBinary();
$composer = findComposerBinary();

echo "Detected PHP: {$php}\n";
echo "Detected Composer: {$composer}\n\n";

// Step 1: Install/Update Dependencies
echo "=== Step 1: Installing Dependencies ===\n";
runCommand("{$composer} install --no-dev --optimize-autoloader --no-interaction", "Install PHP dependencies");

// Step 2: Clear Caches
echo "=== Step 2: Clearing Caches ===\n";
runCommand("{$php} artisan config:clear", "Clear config cache");
runCommand("{$php} artisan route:clear", "Clear route cache");
runCommand("{$php} artisan view:clear", "Clear view cache");

// Step 3: Cache Configurations
echo "=== Step 3: Caching Configurations ===\n";
runCommand("{$php} artisan config:cache", "Cache configurations");
runCommand("{$php} artisan route:cache", "Cache routes");

// Step 4: Fix Storage
echo "=== Step 4: Fixing Storage ===\n";
runCommand("{$php} artisan storage:link --force", "Create storage symlink");

// Create directories manually if needed
$directories = [
    'storage/app/public/finance_files',
    'storage/app/public/profile_images', 
    'storage/app/public/profile-images',
    'storage/app/public/meeting_files'
];

echo "Creating necessary directories:\n";
foreach ($directories as $dir) {
    if (!file_exists($dir)) {
        if (mkdir($dir, 0755, true)) {
            echo "✓ Created: {$dir}\n";
        } else {
            echo "❌ Failed to create: {$dir}\n";
        }
    } else {
        echo "✓ Exists: {$dir}\n";
    }
}
echo "\n";

// Step 5: Set Permissions
echo "=== Step 5: Setting Permissions ===\n";
runCommand("chmod -R 755 storage", "Set storage permissions");
runCommand("chmod -R 755 public", "Set public permissions");
runCommand("find storage -type f -exec chmod 644 {} \\;", "Set storage file permissions");
runCommand("find public -type f -exec chmod 644 {} \\;", "Set public file permissions");

// Step 6: Run Storage Diagnostic
echo "=== Step 6: Running Storage Diagnostic ===\n";
if (file_exists('fix_storage_production.php')) {
    runCommand("{$php} fix_storage_production.php", "Run storage diagnostic");
} else {
    echo "❌ fix_storage_production.php not found\n\n";
}

// Step 7: Build Frontend (if possible)
echo "=== Step 7: Building Frontend Assets ===\n";
if (commandExists('npm')) {
    runCommand("npm install --production", "Install Node dependencies");
    runCommand("npm run build", "Build frontend assets");
} else {
    echo "⚠️  NPM not available - skipping frontend build\n";
    echo "   You may need to build assets locally and upload the public/build/ directory\n\n";
}

// Step 8: Test API Endpoints
echo "=== Step 8: Testing API Endpoints ===\n";
if (file_exists('app/Http/Controllers/FinanceController.php')) {
    echo "✓ FinanceController exists\n";
} else {
    echo "❌ FinanceController not found\n";
}

if (file_exists('app/Models/Finance.php')) {
    echo "✓ Finance model exists\n";
} else {
    echo "❌ Finance model not found\n";
}

// Check route registration
echo "Checking route registration...\n";
$routeCheck = shell_exec("{$php} artisan route:list --path=api/finances 2>&1");
if (strpos($routeCheck, 'view-file') !== false) {
    echo "✓ Finance view-file route registered\n";
} else {
    echo "❌ Finance view-file route not found\n";
}

if (strpos($routeCheck, 'download-file') !== false) {
    echo "✓ Finance download-file route registered\n";
} else {
    echo "❌ Finance download-file route not found\n";
}

echo "\n=== Deployment Complete ===\n";
echo "Please test the following:\n";
echo "1. Finance PDF viewing: https://sys.keadilankb.com/finances\n";
echo "2. API endpoints: https://sys.keadilankb.com/api/finances\n";
echo "3. File access: https://sys.keadilankb.com/api/finances/[ID]/view-file\n\n";

echo "If you encounter issues:\n";
echo "1. Check the deployment guide: DEPLOYMENT_GUIDE.md\n";
echo "2. Review server error logs\n";
echo "3. Ensure all files were uploaded correctly\n";
echo "4. Contact your hosting provider if symlinks don't work\n";