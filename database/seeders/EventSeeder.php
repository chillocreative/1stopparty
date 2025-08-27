<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get existing users
        $users = User::all();

        if ($users->isEmpty()) {
            $this->command->warn('No users found. Make sure to run UserSeeder first.');
            return;
        }

        // Create events for each category with specific role-based creators
        $categories = ['Cabang', 'AMK', 'Wanita'];
        
        foreach ($categories as $category) {
            // Try to find users with roles matching the category
            $categoryUser = $users->whereIn('role.name', [$category, 'Admin'])->first();
            $creator = $categoryUser ?? $users->random();

            // Create past events for this category
            Event::factory()
                ->count(3)
                ->past()
                ->create([
                    'category' => $category,
                    'created_by' => $creator->id,
                ]);

            // Create upcoming events for this category
            Event::factory()
                ->count(4)
                ->upcoming()
                ->create([
                    'category' => $category,
                    'created_by' => $creator->id,
                ]);

            // Create one event for today
            Event::factory()
                ->count(1)
                ->today()
                ->create([
                    'category' => $category,
                    'created_by' => $creator->id,
                ]);
        }

        // Create additional mixed events using factory states
        Event::factory()->count(5)->cabang()->create([
            'created_by' => fn() => $users->random()->id,
        ]);

        Event::factory()->count(5)->amk()->create([
            'created_by' => fn() => $users->random()->id,
        ]);

        Event::factory()->count(5)->wanita()->create([
            'created_by' => fn() => $users->random()->id,
        ]);

        // Create some general random events
        Event::factory()->count(10)->create([
            'created_by' => fn() => $users->random()->id,
        ]);
    }
}