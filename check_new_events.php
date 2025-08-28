<?php
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Get the newly added events with detailed descriptions
$newEvents = \App\Models\Event::with('category')
    ->whereIn('title', [
        'Annual General Meeting 2025',
        'Women Empowerment Workshop',
        'Youth Leadership Program',
        'Community Health Fair',
        'Digital Skills Training'
    ])
    ->get();

echo "Newly added sample events:\n\n";
foreach ($newEvents as $event) {
    echo "Title: {$event->title}\n";
    echo "Category: " . ($event->category ? $event->category->name : 'No category') . "\n";
    echo "Date: {$event->event_date} at {$event->event_time}\n";
    echo "Location: {$event->location}\n";
    echo "Description: " . substr($event->description, 0, 100) . "...\n";
    echo "---\n";
}

// Also check category distribution
echo "\nCategory distribution:\n";
$categories = \App\Models\EventCategory::withCount('events')->get();
foreach ($categories as $category) {
    echo "{$category->name}: {$category->events_count} events\n";
}
