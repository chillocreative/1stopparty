<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Event;
use App\Models\EventCategory;
use App\Models\User;
use Carbon\Carbon;

class EventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first user as the creator (or create a default one)
        $user = User::first();
        if (!$user) {
            $this->command->warn('No users found. Please run UserSeeder first.');
            return;
        }

        // Get event categories
        $categories = EventCategory::all();
        if ($categories->isEmpty()) {
            $this->command->warn('No event categories found. Please run the event categories seeder first.');
            return;
        }

        // Update existing events that don't have categories assigned
        $eventsWithoutCategories = Event::whereNull('category_id')->get();
        if ($eventsWithoutCategories->count() > 0) {
            $this->command->info('Updating ' . $eventsWithoutCategories->count() . ' existing events with categories...');

            foreach ($eventsWithoutCategories as $event) {
                // Assign a random category to existing events
                $randomCategory = $categories->random();
                $event->update(['category_id' => $randomCategory->id]);
            }
        }

        // Sample events data - only create if we have fewer than 60 events total
        $currentEventCount = Event::count();
        if ($currentEventCount < 60) {
            $this->command->info('Adding new sample events...');

            $events = [
                [
                    'title' => 'Annual General Meeting 2025',
                    'description' => 'Our annual general meeting to discuss the organization\'s progress, financial reports, and future plans. All members are encouraged to attend.',
                    'location' => 'Main Conference Hall, Community Center',
                    'event_date' => Carbon::now()->addDays(30)->format('Y-m-d'),
                    'event_time' => '09:00',
                    'category_name' => 'Program Cabang',
                ],
                [
                    'title' => 'Women Empowerment Workshop',
                    'description' => 'A comprehensive workshop focusing on leadership skills, financial literacy, and entrepreneurship for women in our community.',
                    'location' => 'Training Room 2, Community Center',
                    'event_date' => Carbon::now()->addDays(15)->format('Y-m-d'),
                    'event_time' => '14:00',
                    'category_name' => 'Program Wanita',
                ],
                [
                    'title' => 'Youth Leadership Program',
                    'description' => 'A month-long program designed to develop leadership skills among young members aged 18-25. Includes team building activities and leadership seminars.',
                    'location' => 'Youth Center',
                    'event_date' => Carbon::now()->addDays(45)->format('Y-m-d'),
                    'event_time' => '10:00',
                    'category_name' => 'Program AMK',
                ],
                [
                    'title' => 'Council Strategic Planning Session',
                    'description' => 'Strategic planning session for council members to set goals and objectives for the upcoming quarter.',
                    'location' => 'Executive Meeting Room',
                    'event_date' => Carbon::now()->addDays(7)->format('Y-m-d'),
                    'event_time' => '16:00',
                    'category_name' => 'Program Ahli Majlis',
                ],
                [
                    'title' => 'Community Health Fair',
                    'description' => 'Free health screening, medical consultation, and health awareness campaign for all community members.',
                    'location' => 'Community Park',
                    'event_date' => Carbon::now()->addDays(60)->format('Y-m-d'),
                    'event_time' => '08:00',
                    'category_name' => 'Program MPKK',
                ],
                [
                    'title' => 'Environmental Conservation Workshop',
                    'description' => 'Workshop on environmental conservation, recycling programs, and sustainable living practices for the community.',
                    'location' => 'Green Space Center',
                    'event_date' => Carbon::now()->addDays(20)->format('Y-m-d'),
                    'event_time' => '13:00',
                    'category_name' => 'Program JPWK',
                ],
                [
                    'title' => 'Digital Skills Training',
                    'description' => 'Basic computer skills and digital literacy training for community members of all ages.',
                    'location' => 'Computer Lab, Education Center',
                    'event_date' => Carbon::now()->addDays(25)->format('Y-m-d'),
                    'event_time' => '15:00',
                    'category_name' => 'Program JBPP',
                ],
                [
                    'title' => 'Community Sports Day',
                    'description' => 'Annual sports event featuring various competitions including badminton, football, and traditional games for all age groups.',
                    'location' => 'Community Sports Complex',
                    'event_date' => Carbon::now()->addDays(90)->format('Y-m-d'),
                    'event_time' => '07:00',
                    'category_name' => 'Program Cabang',
                ],
                [
                    'title' => 'Cooking and Nutrition Workshop',
                    'description' => 'Hands-on cooking workshop focusing on healthy, affordable meals and proper nutrition for families.',
                    'location' => 'Community Kitchen',
                    'event_date' => Carbon::now()->addDays(35)->format('Y-m-d'),
                    'event_time' => '11:00',
                    'category_name' => 'Program Wanita',
                ],
                [
                    'title' => 'Career Guidance Seminar',
                    'description' => 'Career counseling and guidance session for young adults, including resume writing and interview skills.',
                    'location' => 'Seminar Hall',
                    'event_date' => Carbon::now()->addDays(50)->format('Y-m-d'),
                    'event_time' => '14:30',
                    'category_name' => 'Program AMK',
                ],
                [
                    'title' => 'Financial Planning Workshop',
                    'description' => 'Learn about budgeting, saving, and investment strategies for personal financial management.',
                    'location' => 'Conference Room A',
                    'event_date' => Carbon::now()->addDays(40)->format('Y-m-d'),
                    'event_time' => '19:00',
                    'category_name' => 'Program Cabang',
                ],
                [
                    'title' => 'Emergency Preparedness Training',
                    'description' => 'Community emergency response training covering first aid, disaster preparedness, and emergency procedures.',
                    'location' => 'Fire Station Training Ground',
                    'event_date' => Carbon::now()->addDays(75)->format('Y-m-d'),
                    'event_time' => '09:30',
                    'category_name' => 'Program MPKK',
                ],
                [
                    'title' => 'New Year Celebration 2025',
                    'description' => 'Community celebration to welcome the new year with cultural performances, food, and entertainment.',
                    'location' => 'Community Hall',
                    'event_date' => Carbon::parse('2025-12-31')->format('Y-m-d'),
                    'event_time' => '20:00',
                    'category_name' => 'Program Cabang',
                ],
                [
                    'title' => 'Children Art & Craft Workshop',
                    'description' => 'Creative workshop for children aged 5-12 to explore their artistic talents through various craft activities.',
                    'location' => 'Children Activity Center',
                    'event_date' => Carbon::now()->addDays(12)->format('Y-m-d'),
                    'event_time' => '10:30',
                    'category_name' => 'Program AMK',
                ],
                [
                    'title' => 'Traditional Cooking Competition',
                    'description' => 'Cooking competition featuring traditional Malaysian dishes. Open to all community members.',
                    'location' => 'Community Kitchen',
                    'event_date' => Carbon::now()->addDays(55)->format('Y-m-d'),
                    'event_time' => '16:00',
                    'category_name' => 'Program Wanita',
                ]
            ];

            $users = User::all();

            foreach ($events as $eventData) {
                // Check if event with same title already exists
                $existingEvent = Event::where('title', $eventData['title'])->first();
                if ($existingEvent) {
                    continue; // Skip if already exists
                }

                // Find the category by name
                $category = $categories->firstWhere('name', $eventData['category_name']);
                $creator = $users->random();

                Event::create([
                    'title' => $eventData['title'],
                    'description' => $eventData['description'],
                    'location' => $eventData['location'],
                    'event_date' => $eventData['event_date'],
                    'event_time' => $eventData['event_time'],
                    'category_id' => $category ? $category->id : null,
                    'created_by' => $creator->id,
                ]);
            }
        }

        $this->command->info('Events seeding completed! Total events: ' . Event::count());
    }
}
