<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

// Get roles from database
use App\Models\Role;

echo "Checking roles in database:\n";
echo "=============================\n";

try {
    $roles = Role::all();

    if ($roles->count() > 0) {
        echo "Found " . $roles->count() . " roles:\n\n";

        foreach ($roles as $role) {
            echo "ID: {$role->id}\n";
            echo "Name: {$role->name}\n";
            echo "Description: {$role->description}\n";
            echo "Created: {$role->created_at}\n";
            echo "---\n";
        }

        // Test API response format
        echo "\nTesting API response format:\n";
        echo "============================\n";

        $apiRoles = Role::select(['id', 'name'])->get();
        $response = [
            'success' => true,
            'data' => $apiRoles
        ];

        echo json_encode($response, JSON_PRETTY_PRINT);
    } else {
        echo "No roles found! Please run: php artisan db:seed --class=RoleSeeder\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Make sure the database is connected and tables are migrated.\n";
}
