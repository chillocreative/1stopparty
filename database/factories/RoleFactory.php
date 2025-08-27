<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Role>
 */
class RoleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $roles = [
            'Admin' => 'Full system access and user management',
            'Anggota Cabang' => 'Basic member with view-only access',
            'Bendahari' => 'Financial management and reporting',
            'Setiausaha' => 'Administrative and meeting management',
            'Setiausaha Pengelola' => 'Senior administrative role',
            'AMK' => 'Youth wing activities and events',
            'Wanita' => 'Women\'s wing activities and events',
        ];

        $roleName = fake()->randomElement(array_keys($roles));
        
        return [
            'name' => $roleName,
            'description' => $roles[$roleName],
        ];
    }
}