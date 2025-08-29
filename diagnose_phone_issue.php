<?php
/**
 * Phone Field Issue Diagnostic Script
 * This helps identify why the phone field still doesn't work
 * Upload and run: php diagnose_phone_issue.php
 */

echo "=== Phone Field Issue Diagnosis ===\n\n";

// 1. Check CreateUser.jsx file
echo "1. Checking CreateUser.jsx file:\n";
$createUserFile = __DIR__ . '/resources/js/pages/CreateUser.jsx';

if (file_exists($createUserFile)) {
    echo "   ✓ File exists\n";
    
    $content = file_get_contents($createUserFile);
    
    // Check for the problematic code
    if (strpos($content, "value.startsWith('01')") !== false) {
        echo "   ❌ ISSUE FOUND: File still contains restrictive '01' validation\n";
        echo "   → The file on server hasn't been updated with the fix\n";
    } else {
        echo "   ✓ File doesn't contain the restrictive '01' validation\n";
    }
    
    // Check for phone field validation
    if (strpos($content, 'name="phone"') !== false) {
        echo "   ✓ Phone field exists in component\n";
        
        // Extract the phone validation logic
        if (preg_match('/name="phone".*?onChange=\{[^}]+\}/s', $content, $matches)) {
            echo "   Phone validation code found:\n";
            echo "   " . str_replace("\n", "\n   ", trim($matches[0])) . "\n";
        }
    } else {
        echo "   ❌ Phone field not found in component\n";
    }
} else {
    echo "   ❌ File not found: {$createUserFile}\n";
}

// 2. Check build assets
echo "\n2. Checking build assets:\n";
$manifestFile = __DIR__ . '/public/build/manifest.json';
$buildDir = __DIR__ . '/public/build/assets';

if (file_exists($manifestFile)) {
    echo "   ✓ Manifest file exists\n";
    
    $manifest = json_decode(file_get_contents($manifestFile), true);
    if ($manifest && isset($manifest['resources/js/app.jsx'])) {
        $jsFile = $buildDir . '/' . basename($manifest['resources/js/app.jsx']['file']);
        if (file_exists($jsFile)) {
            echo "   ✓ Main JS file exists: " . basename($jsFile) . "\n";
            echo "   File size: " . number_format(filesize($jsFile)) . " bytes\n";
            echo "   Modified: " . date('Y-m-d H:i:s', filemtime($jsFile)) . "\n";
            
            // Check if the JS contains the problematic code
            $jsContent = file_get_contents($jsFile);
            if (strpos($jsContent, 'startsWith("01")') !== false || strpos($jsContent, "startsWith('01')") !== false) {
                echo "   ❌ ISSUE FOUND: Built JS still contains '01' restriction\n";
                echo "   → Built assets are outdated and need to be rebuilt\n";
            } else {
                echo "   ✓ Built JS doesn't seem to contain '01' restriction\n";
            }
        } else {
            echo "   ❌ Main JS file not found\n";
        }
    } else {
        echo "   ❌ Invalid manifest structure\n";
    }
} else {
    echo "   ❌ Manifest file not found\n";
    echo "   → Frontend assets haven't been built\n";
}

// 3. Check Laravel view
echo "\n3. Checking Laravel views:\n";
$viewFiles = [
    __DIR__ . '/resources/views/dashboard.blade.php',
    __DIR__ . '/resources/views/app.blade.php'
];

foreach ($viewFiles as $viewFile) {
    if (file_exists($viewFile)) {
        echo "   ✓ Found: " . basename($viewFile) . "\n";
        
        $viewContent = file_get_contents($viewFile);
        if (strpos($viewContent, '@vite') !== false || strpos($viewContent, 'mix(') !== false) {
            echo "   ✓ Uses asset compilation\n";
        }
    }
}

// 4. Check web.php routing
echo "\n4. Checking routes:\n";
$webRoutesFile = __DIR__ . '/routes/web.php';
if (file_exists($webRoutesFile)) {
    $routeContent = file_get_contents($webRoutesFile);
    if (strpos($routeContent, 'create-user') !== false || strpos($routeContent, 'users/create') !== false) {
        echo "   ✓ Create user route likely exists\n";
    } else {
        echo "   ? Create user route pattern not found in web.php\n";
    }
}

// 5. Server environment check
echo "\n5. Server environment:\n";
echo "   PHP Version: " . PHP_VERSION . "\n";
echo "   Working Directory: " . __DIR__ . "\n";
echo "   Server Software: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "\n";

// 6. Cache status
echo "\n6. Cache status:\n";
$cacheFiles = [
    'bootstrap/cache/config.php' => 'Config cache',
    'bootstrap/cache/routes.php' => 'Routes cache',
    'bootstrap/cache/services.php' => 'Services cache'
];

foreach ($cacheFiles as $file => $desc) {
    if (file_exists(__DIR__ . '/' . $file)) {
        echo "   ✓ {$desc}: EXISTS (may need clearing)\n";
    } else {
        echo "   ○ {$desc}: Not cached\n";
    }
}

echo "\n=== RECOMMENDATIONS ===\n";

if (strpos(file_get_contents($createUserFile), "value.startsWith('01')") !== false) {
    echo "1. ❌ URGENT: Upload the fixed CreateUser.jsx file\n";
    echo "   → Run: php fix_phone_field.php\n\n";
}

if (!file_exists($manifestFile) || strpos(file_get_contents($buildDir . '/' . basename($manifest['resources/js/app.jsx']['file'] ?? '')), 'startsWith("01")') !== false) {
    echo "2. ❌ URGENT: Upload pre-built assets\n";
    echo "   → Download and upload the public/build/ folder contents\n\n";
}

echo "3. ✓ ALWAYS: Clear caches after any file upload\n";
echo "   Commands:\n";
echo "   php artisan config:clear\n";
echo "   php artisan cache:clear\n";
echo "   php artisan view:clear\n\n";

echo "4. ✓ BROWSER: Clear browser cache (Ctrl+F5)\n\n";

echo "=== NEXT STEPS ===\n";
echo "Based on the issues found above:\n";
echo "1. Fix the source file if needed\n";
echo "2. Upload correct build assets\n"; 
echo "3. Clear all caches\n";
echo "4. Test the form\n";