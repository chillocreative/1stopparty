<?php

require_once 'bootstrap/app.php';

use App\Models\MeetingCategory;

try {
    echo "Checking meeting_categories table...\n";
    $count = MeetingCategory::count();
    echo "Total categories: $count\n";
    
    if ($count > 0) {
        $categories = MeetingCategory::all(['id', 'name', 'description', 'is_active']);
        foreach ($categories as $category) {
            echo "ID: {$category->id} | Name: {$category->name} | Active: " . ($category->is_active ? 'Yes' : 'No') . "\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}