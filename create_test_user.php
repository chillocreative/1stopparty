<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

// Create a test user named ABDUL RAHIM
$role = Role::where('name', 'Admin')->first();

if (!$role) {
    echo "Role not found. Please run the RoleSeeder first.\n";
    exit;
}

$user = User::firstOrCreate(
    ['email' => 'abdulrahim@1stopparty.com'],
    [
        'name' => 'ABDUL RAHIM',
        'ic_number' => '850101125678',
        'phone' => '0123456888',
        'password' => Hash::make('password'),
        'role_id' => $role->id,
        'email_verified_at' => now(),
    ]
);

echo "User created/found: " . $user->name . " (ID: " . $user->id . ")\n";
echo "Email: " . $user->email . "\n";
echo "Role: " . $user->role->name . "\n";
