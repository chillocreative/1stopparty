<?php

namespace Database\Seeders;

use App\Models\Meeting;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MeetingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get existing users and roles
        $users = User::all();
        $roles = Role::all();

        if ($users->isEmpty() || $roles->isEmpty()) {
            $this->command->warn('No users or roles found. Make sure to run UserSeeder and RoleSeeder first.');
            return;
        }

        // Create meetings for each role with specific scenarios
        foreach ($roles as $role) {
            $user = $users->where('role_id', $role->id)->first() ?? $users->random();

            // Create past meetings
            Meeting::factory()
                ->count(3)
                ->past()
                ->create([
                    'created_by' => $user->id,
                    'role_id' => $role->id,
                ]);

            // Create upcoming meetings
            Meeting::factory()
                ->count(2)
                ->upcoming()
                ->create([
                    'created_by' => $user->id,
                    'role_id' => $role->id,
                ]);

            // Create some meetings without files
            Meeting::factory()
                ->count(1)
                ->withoutFile()
                ->create([
                    'created_by' => $user->id,
                    'role_id' => $role->id,
                ]);
        }

        // Create additional random meetings
        Meeting::factory()
            ->count(15)
            ->create([
                'created_by' => fn() => $users->random()->id,
                'role_id' => fn() => $roles->random()->id,
            ]);
    }
}