<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Role;

class DeleteNonAdminUsers extends Command
{
    protected $signature = 'users:delete-non-admin';
    protected $description = 'Delete all users except those with Admin role';

    public function handle()
    {
        // Get Admin role
        $adminRole = Role::where('name', 'Admin')->first();

        if (!$adminRole) {
            $this->error('Admin role not found!');
            return 1;
        }

        // Delete all users except admins
        $deleted = User::where('role_id', '!=', $adminRole->id)->delete();

        $this->info("Successfully deleted {$deleted} non-admin users.");

        return 0;
    }
}
