<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EventCategory;

class EventCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Program Cabang',
                'description' => 'Events related to branch programs and activities',
                'color' => '#3B82F6', // Blue
            ],
            [
                'name' => 'Program Wanita',
                'description' => 'Women\'s programs and activities',
                'color' => '#EC4899', // Pink
            ],
            [
                'name' => 'Program AMK',
                'description' => 'AMK programs and activities',
                'color' => '#10B981', // Green
            ],
            [
                'name' => 'Program Ahli Majlis',
                'description' => 'Council member programs and activities',
                'color' => '#F59E0B', // Yellow
            ],
            [
                'name' => 'Program MPKK',
                'description' => 'MPKK programs and activities',
                'color' => '#8B5CF6', // Purple
            ],
            [
                'name' => 'Program JPWK',
                'description' => 'JPWK programs and activities',
                'color' => '#EF4444', // Red
            ],
            [
                'name' => 'Program JBPP',
                'description' => 'JBPP programs and activities',
                'color' => '#06B6D4', // Cyan
            ],
        ];

        foreach ($categories as $category) {
            EventCategory::firstOrCreate(
                ['name' => $category['name']],
                $category
            );
        }
    }
}
