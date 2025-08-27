<?php

namespace Database\Seeders;

use App\Models\Finance;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class FinanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create income records
        Finance::factory()
            ->count(30)
            ->income()
            ->create();

        // Create expense records
        Finance::factory()
            ->count(40)
            ->expense()
            ->create();

        // Create additional mixed records
        Finance::factory()
            ->count(50)
            ->create();

        $this->command->info('Created ' . Finance::count() . ' finance records total.');
    }
}