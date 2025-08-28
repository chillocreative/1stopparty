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
            $table->text('openai_api_key')->nullable()->after('deepseek_base_url');
            $table->string('openai_base_url')->default('https://api.openai.com/v1')->after('openai_api_key');
            $table->string('openai_model')->default('gpt-4o')->after('openai_base_url');
            $table->string('ai_provider')->default('deepseek')->after('openai_model'); // 'deepseek' or 'openai'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_settings', function (Blueprint $table) {
            $table->dropColumn([
                'openai_api_key',
                'openai_base_url',
                'openai_model',
                'ai_provider'
            ]);
        });
    }
};
