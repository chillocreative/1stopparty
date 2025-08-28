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
        // Drop the existing finances table completely
        Schema::dropIfExists('finances');
        
        // Create the new finances table with correct structure
        Schema::create('finances', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->integer('month');
            $table->integer('year');
            $table->decimal('wang_masuk', 12, 2)->default(0);
            $table->decimal('wang_keluar', 12, 2)->default(0);
            $table->decimal('baki', 12, 2)->default(0);
            $table->string('file_path')->nullable();
            $table->json('details')->nullable();
            $table->unsignedBigInteger('uploaded_by');
            $table->timestamps();
            
            $table->foreign('uploaded_by')->references('id')->on('users');
            $table->unique(['month', 'year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('finances');
        
        // Restore the original table structure if needed
        Schema::create('finances', function (Blueprint $table) {
            $table->id();
            $table->decimal('balance', 15, 2);
            $table->date('transaction_date');
            $table->enum('type', ['income', 'expense']);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }
};