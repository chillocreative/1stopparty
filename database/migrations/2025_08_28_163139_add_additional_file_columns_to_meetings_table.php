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
            $table->string('penyata_kewangan_file')->nullable()->after('minit_mesyuarat_file');
            $table->string('aktiviti_file')->nullable()->after('penyata_kewangan_file');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('meetings', function (Blueprint $table) {
            $table->dropColumn(['penyata_kewangan_file', 'aktiviti_file']);
        });
    }
};
