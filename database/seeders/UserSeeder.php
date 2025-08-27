<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all roles
        $adminRole = Role::where('name', 'Admin')->first();
        $anggotaCabangRole = Role::where('name', 'Anggota Cabang')->first();
        $bendahariRole = Role::where('name', 'Bendahari')->first();
        $setiausahaRole = Role::where('name', 'Setiausaha')->first();
        $setiausahaPengelolaRole = Role::where('name', 'Setiausaha Pengelola')->first();
        $amkRole = Role::where('name', 'AMK')->first();
        $wanitaRole = Role::where('name', 'Wanita')->first();

        // Create main admin user
        User::firstOrCreate(
            ['email' => 'admin@1stopparty.com'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
                'email_verified_at' => now(),
            ]
        );

        // Create additional admin user
        User::firstOrCreate(
            ['email' => 'superadmin@1stopparty.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password123'),
                'role_id' => $adminRole->id,
                'email_verified_at' => now(),
            ]
        );

        // Create specific role users with meaningful names
        $roleUsers = [
            [
                'name' => 'Ahmad Bendahari',
                'email' => 'bendahari@1stopparty.com',
                'role_id' => $bendahariRole->id,
                'password' => 'bendahari123'
            ],
            [
                'name' => 'Siti Setiausaha',
                'email' => 'setiausaha@1stopparty.com',
                'role_id' => $setiausahaRole->id,
                'password' => 'setiausaha123'
            ],
            [
                'name' => 'Rahman Setiausaha Pengelola',
                'email' => 'pengelola@1stopparty.com',
                'role_id' => $setiausahaPengelolaRole->id,
                'password' => 'pengelola123'
            ],
            [
                'name' => 'Ali AMK Leader',
                'email' => 'amk@1stopparty.com',
                'role_id' => $amkRole->id,
                'password' => 'amk123'
            ],
            [
                'name' => 'Fatimah Wanita Leader',
                'email' => 'wanita@1stopparty.com',
                'role_id' => $wanitaRole->id,
                'password' => 'wanita123'
            ],
            [
                'name' => 'Member Anggota',
                'email' => 'anggota@1stopparty.com',
                'role_id' => $anggotaCabangRole->id,
                'password' => 'anggota123'
            ]
        ];

        foreach ($roleUsers as $userData) {
            User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make($userData['password']),
                    'role_id' => $userData['role_id'],
                    'email_verified_at' => now(),
                ]
            );
        }

        // Create additional random users for each role
        $roles = Role::all();
        foreach ($roles as $role) {
            User::factory(2)->create([
                'role_id' => $role->id,
            ]);
        }
    }
}