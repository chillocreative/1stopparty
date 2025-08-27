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
        Schema::table('meetings', function (Blueprint $table) {
            // Add time field
            $table->time('time')->nullable()->after('date');
            
            // Rename file_path to minit_mesyuarat_file for better clarity
            $table->renameColumn('file_path', 'minit_mesyuarat_file');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('meetings', function (Blueprint $table) {
            // Remove time field
            $table->dropColumn('time');
            
            // Rename back to original column name
            $table->renameColumn('minit_mesyuarat_file', 'file_path');
        });
    }
};
