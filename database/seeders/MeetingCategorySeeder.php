<?php

namespace Database\Seeders;

use App\Models\MeetingCategory;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MeetingCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Mesyuarat Cabang',
                'description' => 'Mesyuarat rutin cabang untuk aktiviti dan perbincangan parti secara umum',
                'is_active' => true,
            ],
            [
                'name' => 'Mesyuarat Wanita',
                'description' => 'Mesyuarat sayap wanita yang memfokuskan program dan inisiatif khusus wanita',
                'is_active' => true,
            ],
            [
                'name' => 'Mesyuarat AMK',
                'description' => 'Mesyuarat sayap belia untuk ahli muda parti dan program belia',
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            MeetingCategory::firstOrCreate(
                ['name' => $category['name']],
                $category
            );
        }
    }
}
