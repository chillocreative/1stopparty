<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Event>
 */
class EventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = ['Cabang', 'AMK', 'Wanita'];
        $category = fake()->randomElement($categories);
        
        // Generate category-specific event titles
        $eventTitles = [
            'Cabang' => [
                'Branch Annual General Meeting',
                'Branch Committee Meeting',
                'Branch Leadership Training',
                'Branch Development Workshop',
                'Branch Strategic Planning Session',
            ],
            'AMK' => [
                'Youth Leadership Camp',
                'Youth Skills Development Workshop',
                'AMK Sports Tournament',
                'Youth Community Service Project',
                'AMK Career Development Seminar',
            ],
            'Wanita' => [
                'Women Empowerment Workshop',
                'Ladies Networking Session',
                'Women in Leadership Forum',
                'Female Entrepreneur Meetup',
                'Women Health & Wellness Seminar',
            ],
        ];

        $locations = [
            'Main Conference Hall',
            'Community Center',
            'Hotel Grand Ballroom',
            'Branch Office Meeting Room',
            'Outdoor Pavilion',
            'Training Center Auditorium',
            'Local Sports Complex',
            'Cultural Center',
        ];

        return [
            'title' => fake()->randomElement($eventTitles[$category]),
            'description' => fake()->paragraph(3) . ' This event is specifically organized for ' . $category . ' members and will focus on relevant topics and activities.',
            'location' => fake()->randomElement($locations),
            'event_date' => fake()->dateTimeBetween('now', '+6 months')->format('Y-m-d'),
            'event_time' => fake()->time('H:i'),
            'category' => $category,
            'created_by' => User::factory(),
        ];
    }

    /**
     * Indicate that the event is for Cabang category.
     */
    public function cabang(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => 'Cabang',
            'title' => 'Branch ' . fake()->randomElement([
                'Annual General Meeting',
                'Committee Meeting',
                'Leadership Training',
                'Development Workshop',
                'Strategic Planning Session',
            ]),
        ]);
    }

    /**
     * Indicate that the event is for AMK category.
     */
    public function amk(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => 'AMK',
            'title' => fake()->randomElement([
                'Youth Leadership Camp',
                'Youth Skills Development Workshop',
                'AMK Sports Tournament',
                'Youth Community Service Project',
                'AMK Career Development Seminar',
            ]),
        ]);
    }

    /**
     * Indicate that the event is for Wanita category.
     */
    public function wanita(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => 'Wanita',
            'title' => fake()->randomElement([
                'Women Empowerment Workshop',
                'Ladies Networking Session',
                'Women in Leadership Forum',
                'Female Entrepreneur Meetup',
                'Women Health & Wellness Seminar',
            ]),
        ]);
    }

    /**
     * Indicate that the event is scheduled for today.
     */
    public function today(): static
    {
        return $this->state(fn (array $attributes) => [
            'event_date' => now()->format('Y-m-d'),
            'event_time' => fake()->time('H:i'),
        ]);
    }

    /**
     * Indicate that the event is in the past.
     */
    public function past(): static
    {
        return $this->state(fn (array $attributes) => [
            'event_date' => fake()->dateTimeBetween('-6 months', 'yesterday')->format('Y-m-d'),
        ]);
    }

    /**
     * Indicate that the event is upcoming.
     */
    public function upcoming(): static
    {
        return $this->state(fn (array $attributes) => [
            'event_date' => fake()->dateTimeBetween('tomorrow', '+6 months')->format('Y-m-d'),
        ]);
    }
}