<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RolesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            'Admin',
            'Anggota Cabang',
            'Bendahari',
            'Setiausaha',
            'Setiausaha Pengelola',
            'AMK',
            'Wanita',
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(
                ['name' => $role]
            );
        }

        $this->command->info('Created ' . count($roles) . ' default roles.');
    }
}