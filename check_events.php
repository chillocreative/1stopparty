<?php
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$events = \App\Models\Event::with('category')->take(10)->get();
echo "Total events: " . \App\Models\Event::count() . "\n\n";

echo "First 10 events:\n";
foreach ($events as $event) {
    echo "ID: {$event->id}\n";
    echo "Title: {$event->title}\n";
    echo "Category: " . ($event->category ? $event->category->name : 'No category') . "\n";
    echo "Date: {$event->event_date}\n";
    echo "Location: {$event->location}\n";
    echo "---\n";
}
