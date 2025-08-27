<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Finance>
 */
class FinanceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = fake()->randomElement(['income', 'expense']);
        
        // Generate different amounts based on type
        if ($type === 'income') {
            $balance = fake()->randomFloat(2, 100, 10000); // Income: RM100 - RM10,000
            $notes = fake()->randomElement([
                'Membership fees collection',
                'Event ticket sales',
                'Sponsorship received',
                'Fundraising activity',
                'Grant received',
                'Donation received',
            ]);
        } else {
            $balance = fake()->randomFloat(2, 50, 5000); // Expense: RM50 - RM5,000
            $notes = fake()->randomElement([
                'Event venue rental',
                'Catering expenses',
                'Office supplies',
                'Transportation costs',
                'Marketing materials',
                'Utility bills',
                'Equipment purchase',
            ]);
        }

        return [
            'balance' => $balance,
            'transaction_date' => fake()->dateTimeBetween('-12 months', 'now')->format('Y-m-d'),
            'type' => $type,
            'notes' => $notes,
        ];
    }

    /**
     * Indicate that the finance record is income.
     */
    public function income(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'income',
            'balance' => fake()->randomFloat(2, 200, 15000),
            'notes' => fake()->randomElement([
                'Membership fees collection',
                'Event ticket sales',
                'Sponsorship received',
                'Fundraising activity',
                'Grant received',
                'Donation received',
            ]),
        ]);
    }

    /**
     * Indicate that the finance record is expense.
     */
    public function expense(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'expense',
            'balance' => fake()->randomFloat(2, 100, 8000),
            'notes' => fake()->randomElement([
                'Event venue rental',
                'Catering expenses',
                'Office supplies',
                'Transportation costs',
                'Marketing materials',
                'Utility bills',
                'Equipment purchase',
            ]),
        ]);
    }
}