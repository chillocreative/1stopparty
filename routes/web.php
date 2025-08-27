<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

Route::get('/', function () {
    return view('welcome');
});

// Add login route for authentication redirects
Route::get('/login', function () {
    return view('login');
})->name('login');

Route::post('/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required'],
    ]);

    if (Auth::attempt($credentials)) {
        $request->session()->regenerate();
        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'user' => Auth::user()->load('role')
        ]);
    }

    return response()->json([
        'success' => false,
        'message' => 'The provided credentials do not match our records.'
    ], 422);
});

Route::post('/register', function (Request $request) {
    $validated = $request->validate([
        'name' => ['required', 'string', 'max:255'],
        'ic_number' => ['required', 'string', 'regex:/^\d{12}$/'],
        'phone' => ['required', 'string', 'regex:/^01[0-9]{8,9}$/'],
        'email' => ['nullable', 'string', 'email', 'max:255', 'unique:users'],
        'password' => ['required', 'string', 'min:8', 'confirmed']
    ]);

    // Find Anggota Biasa role or create it if it doesn't exist
    $defaultRole = \App\Models\Role::firstOrCreate(
        ['name' => 'Anggota Biasa'],
        ['description' => 'Regular member of the organization']
    );

    $user = User::create([
        'name' => $validated['name'],
        'ic_number' => $validated['ic_number'],
        'phone' => $validated['phone'],
        'email' => $validated['email'] ?? null,
        'password' => bcrypt($validated['password']),
        'role_id' => $defaultRole->id,
    ]);

    Auth::login($user);

    return response()->json([
        'success' => true,
        'message' => 'Registration successful',
        'user' => $user->load('role')
    ]);
});

Route::post('/logout', function (Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return response()->json([
        'success' => true,
        'message' => 'Logged out successfully'
    ]);
})->middleware('auth');

Route::get('/register', function () {
    return view('register');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/profile', function () {
    return view('dashboard');
})->middleware(['auth'])->name('profile');

// Profile update route using web middleware
Route::post('/profile/update', [App\Http\Controllers\ProfileController::class, 'update'])
    ->middleware(['auth'])->name('profile.update');

// Users Routes (Admin only)
Route::middleware(['auth', 'role:Admin'])->group(function () {
    // View routes
    Route::get('/users', function () {
        return view('dashboard');
    })->name('users.index');

    Route::get('/users/create', function () {
        return view('dashboard');
    })->name('users.create');

    Route::get('/users/edit/{user?}', function () {
        return view('dashboard');
    })->name('users.edit');

    // Web API routes for users data (to avoid API middleware issues)
    Route::get('/users/data', [App\Http\Controllers\UsersController::class, 'index'])->name('users.data');
    Route::get('/users/{user}/data', [App\Http\Controllers\UsersController::class, 'show'])->name('users.show.data');
    Route::post('/users/store', [App\Http\Controllers\UserController::class, 'store'])->name('users.store.data');
    Route::put('/users/{user}/update', [App\Http\Controllers\UserController::class, 'update'])->name('users.update.data');
    Route::delete('/users/{user}/delete', [App\Http\Controllers\UserController::class, 'destroy'])->name('users.delete.data');
});
