<?php

require 'vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as DB;
use App\Models\Meeting;
use App\Models\MeetingCategory;

// Set up database connection
$capsule = new DB;
$capsule->addConnection([
    'driver'    => 'sqlite',
    'database'  => 'database/database.sqlite',
]);
$capsule->setAsGlobal();
$capsule->bootEloquent();

try {
    echo "Starting category assignment...\n";

    // Get all categories
    $categories = MeetingCategory::all();

    if ($categories->count() === 0) {
        echo "No categories found. Please run the seeder first.\n";
        exit;
    }

    echo "Found " . $categories->count() . " categories:\n";
    foreach ($categories as $category) {
        echo "- {$category->name}\n";
    }

    // Get all meetings without categories
    $meetings = Meeting::whereNull('category_id')->get();

    echo "\nFound " . $meetings->count() . " meetings without categories.\n";

    if ($meetings->count() === 0) {
        echo "All meetings already have categories assigned.\n";
        exit;
    }

    // Assign random categories to meetings
    foreach ($meetings as $meeting) {
        $randomCategory = $categories->random();
        $meeting->update(['category_id' => $randomCategory->id]);
        echo "Assigned '{$randomCategory->name}' to meeting: {$meeting->title}\n";
    }

    echo "\nCategory assignment completed successfully!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
