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
        $anggotaBiasaRole = Role::where('name', 'Anggota Biasa')->first();
        $bendahariRole = Role::where('name', 'Bendahari')->first();
        $setiausahaRole = Role::where('name', 'Setiausaha')->first();
        $setiausahaPengelolaRole = Role::where('name', 'Setiausaha Pengelola')->first();
        $amkRole = Role::where('name', 'AMK')->first();
        $wanitaRole = Role::where('name', 'Wanita')->first();
        $ajkCabangRole = Role::where('name', 'AJK Cabang')->first();

        // Create main admin user
        User::firstOrCreate(
            ['email' => 'admin@1stopparty.com'],
            [
                'name' => 'System Administrator',
                'ic_number' => '900101101234',
                'phone' => '0123456789',
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
                'ic_number' => '850505055678',
                'phone' => '0198765432',
                'password' => Hash::make('password123'),
                'role_id' => $adminRole->id,
                'email_verified_at' => now(),
            ]
        );

        // Create specific role users with meaningful names
        $roleUsers = [
            [
                'name' => 'Ahmad Bendahari',
                'ic_number' => '880505101234',
                'phone' => '0123456701',
                'email' => 'bendahari@1stopparty.com',
                'role_id' => $bendahariRole->id,
                'password' => 'bendahari123'
            ],
            [
                'name' => 'Siti Setiausaha',
                'ic_number' => '920303121234',
                'phone' => '0123456702',
                'email' => 'setiausaha@1stopparty.com',
                'role_id' => $setiausahaRole->id,
                'password' => 'setiausaha123'
            ],
            [
                'name' => 'Rahman Setiausaha Pengelola',
                'ic_number' => '801010141234',
                'phone' => '0123456703',
                'email' => 'pengelola@1stopparty.com',
                'role_id' => $setiausahaPengelolaRole->id,
                'password' => 'pengelola123'
            ],
            [
                'name' => 'Ali AMK Leader',
                'ic_number' => '950707151234',
                'phone' => '0123456704',
                'email' => 'amk@1stopparty.com',
                'role_id' => $amkRole->id,
                'password' => 'amk123'
            ],
            [
                'name' => 'Fatimah Wanita Leader',
                'ic_number' => '890909161234',
                'phone' => '0123456705',
                'email' => 'wanita@1stopparty.com',
                'role_id' => $wanitaRole->id,
                'password' => 'wanita123'
            ],
            [
                'name' => 'Hassan AJK Cabang',
                'ic_number' => '870101171234',
                'phone' => '0123456706',
                'email' => 'ajk@1stopparty.com',
                'role_id' => $ajkCabangRole->id,
                'password' => 'ajk123'
            ],
            [
                'name' => 'Anggota Biasa Ahmad',
                'ic_number' => '940404181234',
                'phone' => '0123456707',
                'email' => 'anggota@1stopparty.com',
                'role_id' => $anggotaBiasaRole->id,
                'password' => 'anggota123'
            ]
        ];

        foreach ($roleUsers as $userData) {
            User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'ic_number' => $userData['ic_number'],
                    'phone' => $userData['phone'],
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