<?php

namespace Database\Seeders;

use App\Models\Member;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MemberSeeder extends Seeder
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

        // Create members uploaded by different users
        foreach ($users as $user) {
            // Each user uploads between 5-15 members
            $memberCount = fake()->numberBetween(5, 15);
            
            Member::factory()
                ->count($memberCount)
                ->uploadedBy($user)
                ->create();
        }

        // Create some members from specific states for variety
        $states = ['Johor', 'Selangor', 'Penang', 'Perak', 'Sabah', 'Sarawak'];
        
        foreach ($states as $state) {
            Member::factory()
                ->count(5)
                ->fromState($state)
                ->create([
                    'uploaded_by' => $users->random()->id,
                ]);
        }

        // Create some members without email addresses
        Member::factory()
            ->count(20)
            ->withoutEmail()
            ->create([
                'uploaded_by' => fn() => $users->random()->id,
            ]);

        // Create additional random members
        Member::factory()
            ->count(50)
            ->create([
                'uploaded_by' => fn() => $users->random()->id,
            ]);

        $this->command->info('Created ' . Member::count() . ' members total.');
    }
}