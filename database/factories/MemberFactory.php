<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Member>
 */
class MemberFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'ic_no' => $this->generateMalaysianIC(),
            'phone' => $this->generateMalaysianPhone(),
            'email' => fake()->optional(0.8)->safeEmail(),
            'uploaded_by' => User::factory(),
        ];
    }

    /**
     * Generate a realistic Malaysian IC number format
     */
    private function generateMalaysianIC(): string
    {
        // Generate birth year (1950-2005)
        $year = fake()->numberBetween(50, 99);
        if ($year < 50) {
            $year = '0' . $year;
        }

        // Generate birth month (01-12)
        $month = fake()->numberBetween(1, 12);
        $month = str_pad($month, 2, '0', STR_PAD_LEFT);

        // Generate birth day (01-28 to avoid invalid dates)
        $day = fake()->numberBetween(1, 28);
        $day = str_pad($day, 2, '0', STR_PAD_LEFT);

        // Generate place of birth code (01-16 for states)
        $stateCode = str_pad(fake()->numberBetween(1, 16), 2, '0', STR_PAD_LEFT);

        // Generate gender and serial number (last 4 digits)
        $serialNumber = fake()->numberBetween(1000, 9999);

        return $year . $month . $day . $stateCode . $serialNumber;
    }

    /**
     * Generate a realistic Malaysian phone number
     */
    private function generateMalaysianPhone(): string
    {
        $formats = [
            '01' . fake()->numberBetween(10000000, 99999999), // Mobile
            '03' . fake()->numberBetween(10000000, 99999999), // KL/Selangor
            '04' . fake()->numberBetween(1000000, 9999999),   // Penang/Kedah
            '05' . fake()->numberBetween(1000000, 9999999),   // Perak
            '06' . fake()->numberBetween(1000000, 9999999),   // Melaka/Negeri Sembilan
            '07' . fake()->numberBetween(1000000, 9999999),   // Johor
            '09' . fake()->numberBetween(1000000, 9999999),   // Kelantan/Terengganu/Pahang
        ];

        return fake()->randomElement($formats);
    }

    /**
     * Indicate that the member has no email.
     */
    public function withoutEmail(): static
    {
        return $this->state(fn (array $attributes) => [
            'email' => null,
        ]);
    }

    /**
     * Create a member with a specific uploader.
     */
    public function uploadedBy(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'uploaded_by' => $user->id,
        ]);
    }

    /**
     * Create a member from a specific state (for testing bulk imports).
     */
    public function fromState(string $state): static
    {
        $stateCodes = [
            'Johor' => '01',
            'Kedah' => '02',
            'Kelantan' => '03',
            'Melaka' => '04',
            'Negeri Sembilan' => '05',
            'Pahang' => '06',
            'Penang' => '07',
            'Perak' => '08',
            'Perlis' => '09',
            'Sabah' => '12',
            'Sarawak' => '13',
            'Selangor' => '10',
            'Terengganu' => '11',
            'Kuala Lumpur' => '14',
            'Labuan' => '15',
            'Putrajaya' => '16',
        ];

        $stateCode = $stateCodes[$state] ?? '10';

        return $this->state(function (array $attributes) use ($stateCode) {
            // Modify the IC number to use the specific state code
            $icParts = str_split($attributes['ic_no'], 2);
            $icParts[3] = $stateCode;
            
            return [
                'ic_no' => implode('', $icParts),
            ];
        });
    }
}