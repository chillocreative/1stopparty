<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            MeetingSeeder::class,
            EventCategorySeeder::class,
            EventSeeder::class,
            MemberSeeder::class,
            FinanceSeeder::class,
        ]);
    }
}
