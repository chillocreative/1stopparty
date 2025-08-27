<?php

namespace Database\Factories;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Meeting>
 */
class MeetingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $meetingTypes = [
            'Monthly Board Meeting',
            'Annual General Meeting',
            'Committee Meeting',
            'Planning Session',
            'Budget Review Meeting',
            'Strategic Planning Meeting',
            'Emergency Meeting',
            'Quarterly Review',
        ];

        return [
            'title' => fake()->randomElement($meetingTypes) . ' - ' . fake()->monthName() . ' ' . fake()->year(),
            'date' => fake()->dateTimeBetween('-6 months', '+3 months')->format('Y-m-d'),
            'time' => fake()->optional(0.8)->time(),
            'minit_mesyuarat_file' => fake()->optional(0.7)->regexify('meetings/[0-9]{4}/[0-9]{2}/meeting_[0-9a-f]{8}\.pdf'),
            'created_by' => User::factory(),
            'role_id' => Role::factory(),
        ];
    }

    /**
     * Indicate that the meeting has no file attached.
     */
    public function withoutFile(): static
    {
        return $this->state(fn (array $attributes) => [
            'minit_mesyuarat_file' => null,
        ]);
    }

    /**
     * Indicate that the meeting is scheduled for a future date.
     */
    public function upcoming(): static
    {
        return $this->state(fn (array $attributes) => [
            'date' => fake()->dateTimeBetween('now', '+6 months')->format('Y-m-d'),
        ]);
    }

    /**
     * Indicate that the meeting is in the past.
     */
    public function past(): static
    {
        return $this->state(fn (array $attributes) => [
            'date' => fake()->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
        ]);
    }
}