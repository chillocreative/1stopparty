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
        Schema::table('members', function (Blueprint $table) {
            // Add additional fields that might be in the Excel file
            $table->string('address')->nullable()->after('email');
            $table->string('postcode')->nullable()->after('address');
            $table->string('city')->nullable()->after('postcode');
            $table->string('state')->nullable()->after('city');
            $table->string('occupation')->nullable()->after('state');
            $table->enum('gender', ['M', 'F'])->nullable()->after('occupation');
            $table->date('date_of_birth')->nullable()->after('gender');
            $table->string('membership_type')->nullable()->after('date_of_birth');
            $table->date('join_date')->nullable()->after('membership_type');
            $table->boolean('is_active')->default(true)->after('join_date');
            $table->text('remarks')->nullable()->after('is_active');
            $table->string('original_filename')->nullable()->after('remarks');
            $table->integer('import_batch_id')->nullable()->after('original_filename');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn([
                'address',
                'postcode', 
                'city',
                'state',
                'occupation',
                'gender',
                'date_of_birth',
                'membership_type',
                'join_date',
                'is_active',
                'remarks',
                'original_filename',
                'import_batch_id'
            ]);
        });
    }
};
