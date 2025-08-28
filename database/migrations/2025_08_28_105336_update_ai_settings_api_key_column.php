<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ai_settings', function (Blueprint $table) {
            // Change deepseek_api_key from VARCHAR(255) to TEXT to accommodate encrypted data
            $table->text('deepseek_api_key')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_settings', function (Blueprint $table) {
            // Revert back to string if needed
            $table->string('deepseek_api_key')->nullable()->change();
        });
    }
};
