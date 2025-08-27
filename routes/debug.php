<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/debug/auth', function (Request $request) {
    $user = $request->user();
    
    if ($user) {
        return response()->json([
            'authenticated' => true,
            'user' => $user->load('role'),
            'session_id' => session()->getId(),
            'guards' => config('auth.guards'),
            'default_guard' => config('auth.defaults.guard')
        ]);
    } else {
        return response()->json([
            'authenticated' => false,
            'session_id' => session()->getId(),
            'guards' => config('auth.guards'),
            'default_guard' => config('auth.defaults.guard')
        ], 401);
    }
})->middleware('web');

// Debug route to create test meeting with actual file
Route::get('/debug/create-test-meeting', function () {
    try {
        $user = \App\Models\User::first();
        if (!$user) {
            return response()->json(['error' => 'No users found'], 404);
        }

        $meeting = \App\Models\Meeting::updateOrCreate(
            ['title' => 'Test Meeting with Real File'],
            [
                'title' => 'Test Meeting with Real File',
                'date' => now()->format('Y-m-d'),
                'time' => now()->format('H:i:s'),
                'minit_mesyuarat_file' => 'meeting_files/1756319979_letterhead PKR.docx',
                'created_by' => $user->id,
                'role_id' => $user->role_id,
            ]
        );

        return response()->json([
            'success' => true,
            'meeting' => [
                'id' => $meeting->id,
                'title' => $meeting->title,
                'file_path' => $meeting->minit_mesyuarat_file,
                'file_url' => $meeting->minit_mesyuarat_file_url,
                'test_url' => url('storage/meeting_files/1756319979_letterhead PKR.docx')
            ]
        ]);
    } catch (Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
})->middleware('web');
