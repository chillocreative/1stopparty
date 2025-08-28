<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// This route has been moved to web.php to work with web sessions
// Route::get('/user', ...)->middleware(['web', 'auth']);

// Profile routes
Route::middleware(['web', 'auth'])->group(function () {
    Route::post('/profile/update', [App\Http\Controllers\ProfileController::class, 'update']);
});

// Public roles endpoint for registration
Route::get('/roles', function () {
    return response()->json([
        'success' => true,
        'data' => \App\Models\Role::all(['id', 'name'])
    ]);
});

// Dashboard routes - accessible by all authenticated users
Route::prefix('dashboard')->middleware(['web', 'auth'])->group(function () {
    Route::get('cards', [DashboardController::class, 'cards']);
    Route::get('charts', [DashboardController::class, 'charts']);
});

// Users routes - Only Admin can manage users
Route::apiResource('users', UserController::class)
    ->middleware(['web', 'auth', 'role:Admin']);

// Roles routes - Only Admin can manage roles
Route::apiResource('roles', RoleController::class)
    ->middleware(['web', 'auth', 'role:Admin']);

// Meetings routes - Based on role permissions
Route::middleware(['web', 'auth'])->group(function () {
    // View meetings - All roles can view
    Route::get('meetings', [MeetingController::class, 'index']);
    Route::get('meetings/{meeting}', [MeetingController::class, 'show']);

    // Create/Update/Delete meetings - Only specific roles
    Route::post('meetings', [MeetingController::class, 'store'])
        ->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
    Route::put('meetings/{meeting}', [MeetingController::class, 'update'])
        ->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
    Route::patch('meetings/{meeting}', [MeetingController::class, 'update'])
        ->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
    Route::delete('meetings/{meeting}', [MeetingController::class, 'destroy'])
        ->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
    Route::delete('meetings', [MeetingController::class, 'bulkDestroy'])
        ->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
});

// Events routes - Based on role permissions
Route::middleware(['web', 'auth'])->group(function () {
    // View events - All roles can view
    Route::get('events', [EventController::class, 'index']);
    Route::get('events/{event}', [EventController::class, 'show']);

    // Create/Update/Delete events - Only specific roles
    Route::post('events', [EventController::class, 'store'])
        ->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
    Route::put('events/{event}', [EventController::class, 'update'])
        ->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
    Route::patch('events/{event}', [EventController::class, 'update'])
        ->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
    Route::delete('events/{event}', [EventController::class, 'destroy'])
        ->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
});

// Members routes - Based on role permissions
Route::middleware(['web', 'auth'])->group(function () {
    // Dashboard analytics - All roles can view
    Route::get('members/dashboard-analytics', [MemberController::class, 'getDashboardAnalytics']);
    
    // View members - All roles can view
    Route::get('members', [MemberController::class, 'index']);
    Route::get('members/{member}', [MemberController::class, 'show']);

    // Create/Update/Delete/Import members - Only specific roles
    Route::post('members', [MemberController::class, 'store'])
        ->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
    Route::put('members/{member}', [MemberController::class, 'update'])
        ->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
    Route::patch('members/{member}', [MemberController::class, 'update'])
        ->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
    Route::delete('members/{member}', [MemberController::class, 'destroy'])
        ->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
    
    // File upload and import routes
    Route::post('members/process-upload', [MemberController::class, 'processUpload'])
        ->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
    Route::post('members/import-members', [MemberController::class, 'importMembers'])
        ->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
    Route::delete('members/delete-duplicates', [MemberController::class, 'deleteDuplicates'])
        ->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
    
    // Member approval workflow routes (Admin only)
    Route::get('members/pending', [MemberController::class, 'getPendingMembers'])
        ->middleware('role:Admin');
    Route::post('members/approve', [MemberController::class, 'approveMembers'])
        ->middleware('role:Admin');
    Route::post('members/reject', [MemberController::class, 'rejectMembers'])
        ->middleware('role:Admin');
});

// Finance routes - Admin and Bendahari only
Route::middleware(['web', 'auth', 'role:Admin,Bendahari'])->group(function () {
    Route::get('finances', [App\Http\Controllers\FinanceController::class, 'index']);
    Route::get('finances/{finance}', [App\Http\Controllers\FinanceController::class, 'show']);
    Route::post('finances', [App\Http\Controllers\FinanceController::class, 'store']);
    Route::post('finances/upload-pdf', [App\Http\Controllers\FinanceController::class, 'uploadPdf']);
    Route::post('finances/parse-file', [App\Http\Controllers\FinanceController::class, 'parseFile']);
    Route::post('finances/save-data', [App\Http\Controllers\FinanceController::class, 'saveFinanceData']);
    Route::put('finances/{finance}', [App\Http\Controllers\FinanceController::class, 'update']);
    Route::delete('finances/{finance}', [App\Http\Controllers\FinanceController::class, 'destroy']);
});
