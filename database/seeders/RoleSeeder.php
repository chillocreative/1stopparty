<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Admin',
                'description' => 'Full system access and user management - can perform all operations',
            ],
            [
                'name' => 'Bendahari',
                'description' => 'Financial management and reporting - can manage finances and create meetings/events',
            ],
            [
                'name' => 'Setiausaha',
                'description' => 'Administrative and meeting management - can create/manage meetings and events',
            ],
            [
                'name' => 'Setiausaha Pengelola',
                'description' => 'Senior administrative role - can manage meetings, events, and members',
            ],
            [
                'name' => 'AMK',
                'description' => 'Youth wing activities and events - can manage AMK category events and members',
            ],
            [
                'name' => 'Wanita',
                'description' => 'Women\'s wing activities and events - can manage Wanita category events and members',
            ],
            [
                'name' => 'AJK Cabang',
                'description' => 'Committee members with broader access to manage branch activities',
            ],
            [
                'name' => 'Anggota Biasa',
                'description' => 'Regular members with basic access to view meetings, events, and activities',
            ],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(
                ['name' => $role['name']],
                ['description' => $role['description']]
            );
        }

        $this->command->info('Created ' . count($roles) . ' default roles.');
    }
}