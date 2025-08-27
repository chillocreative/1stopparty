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
        Schema::table('users', function (Blueprint $table) {
            $table->string('ic_number')->after('name')->nullable();
            $table->string('phone')->after('ic_number')->nullable();
            
            // Make email nullable since it's now optional
            $table->string('email')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['ic_number', 'phone']);
            
            // Revert email back to required
            $table->string('email')->nullable(false)->change();
        });
    }
};