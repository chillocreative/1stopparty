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
            $table->string('member_no')->nullable()->after('id');
            $table->string('race')->nullable()->after('gender');
            $table->string('address_2')->nullable()->after('address');
            $table->string('branch')->nullable()->after('state');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn(['member_no', 'race', 'address_2', 'branch']);
        });
    }
};
