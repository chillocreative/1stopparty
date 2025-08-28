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
        Schema::table('events', function (Blueprint $table) {
            // Remove the old category enum column
            $table->dropColumn('category');
            
            // Add new category_id foreign key
            $table->foreignId('category_id')->nullable()->constrained('event_categories')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Remove the category_id foreign key
            $table->dropForeign(['category_id']);
            $table->dropColumn('category_id');
            
            // Restore the old category enum column
            $table->enum('category', ['Cabang', 'AMK', 'Wanita'])->after('event_time');
        });
    }
};
