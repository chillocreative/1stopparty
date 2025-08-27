<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

//# Profile update route using web middleware
Route::post('/profile/update', [App\Http\Controllers\ProfileController::class, 'update'])
    ->middleware(['auth'])->name('profile.update');

//# API Profile update route for React frontend
Route::post('/api/profile/update', [App\Http\Controllers\ProfileController::class, 'update'])
    ->middleware(['web', 'auth'])->name('api.profile.update');

// Debug route to check authentication
Route::get('/debug/auth', function (Request $request) {
    $user = $request->user();
    
    if ($user) {
        return response()->json([
            'authenticated' => true,
            'user' => $user->load('role'),
            'session_id' => session()->getId(),
            'csrf_token' => csrf_token()
        ]);
    } else {
        return response()->json([
            'authenticated' => false,
            'session_id' => session()->getId(),
            'csrf_token' => csrf_token()
        ], 401);
    }
})->middleware('web');

// API User endpoint for React frontend (using web sessions)
Route::get('/api/user', function (Request $request) {
    $user = $request->user();
    
    if (!$user) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthenticated',
            'debug' => [
                'session_id' => session()->getId(),
                'auth_guard' => config('auth.defaults.guard'),
                'csrf_token' => csrf_token(),
            ]
        ], 401);
    }
    
    return response()->json([
        'success' => true,
        'data' => $user->load('role')
    ]);
})->middleware(['web', 'auth']);



// Temporary route for database setup (remove in production)
Route::get('/setup-database', function () {
    try {
        $pdo = new PDO('sqlite:database/database.sqlite');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $results = [];
        $results[] = "Creating sessions table if not exists...";

        // Create sessions table manually if it doesn't exist
        $sessionTableSQL = "
        CREATE TABLE IF NOT EXISTS sessions (
            id VARCHAR(255) PRIMARY KEY NOT NULL,
            user_id BIGINT UNSIGNED NULL,
            ip_address VARCHAR(45) NULL,
            user_agent TEXT NULL,
            payload TEXT NOT NULL,
            last_activity INTEGER NOT NULL
        )";

        $pdo->exec($sessionTableSQL);
        $results[] = "Sessions table created successfully!";

        // Check if meetings table has all required columns
        $results[] = "Checking meetings table structure...";

        try {
            $pdo->query("SELECT time FROM meetings LIMIT 1");
            $results[] = "Meetings table has 'time' column.";
        } catch (PDOException $e) {
            $results[] = "Adding 'time' column to meetings table...";
            try {
                $pdo->exec("ALTER TABLE meetings ADD COLUMN time TIME NULL");
                $results[] = "'time' column added successfully.";
            } catch (PDOException $e2) {
                $results[] = "Error adding time column: " . $e2->getMessage();
            }
        }

        // Check for minit_mesyuarat_file column
        try {
            $pdo->query("SELECT minit_mesyuarat_file FROM meetings LIMIT 1");
            $results[] = "Meetings table has 'minit_mesyuarat_file' column.";
        } catch (PDOException $e) {
            $results[] = "Adding 'minit_mesyuarat_file' column to meetings table...";
            try {
                $pdo->exec("ALTER TABLE meetings ADD COLUMN minit_mesyuarat_file VARCHAR(255) NULL");
                $results[] = "'minit_mesyuarat_file' column added successfully.";
            } catch (PDOException $e2) {
                $results[] = "Error adding minit_mesyuarat_file column: " . $e2->getMessage();
            }
        }

        $results[] = "Database setup completed!";

        return response()->json([
            'success' => true,
            'results' => $results
        ]);

    } catch (Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

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

// Meetings Routes - All users can view, specific roles can manage
Route::middleware('auth')->group(function () {
    // View routes
    Route::get('/meetings', function () {
        return view('dashboard');
    })->name('meetings.index');

    Route::get('/meetings/create', function () {
        return view('dashboard');
    })->name('meetings.create')->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');

    Route::get('/meetings/edit/{meeting?}', function () {
        return view('dashboard');
    })->name('meetings.edit')->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
});

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

    Route::get('/roles', function () {
        return view('dashboard');
    })->name('roles.index');

    // Web API routes for users data (to avoid API middleware issues)
    Route::get('/users/data', [App\Http\Controllers\UsersController::class, 'index'])->name('users.data');
    Route::get('/users/{user}/data', [App\Http\Controllers\UsersController::class, 'show'])->name('users.show.data');
    Route::post('/users/store', [App\Http\Controllers\UserController::class, 'store'])->name('users.store.data');
    Route::put('/users/{user}/update', [App\Http\Controllers\UserController::class, 'update'])->name('users.update.data');
    Route::delete('/users/{user}/delete', [App\Http\Controllers\UserController::class, 'destroy'])->name('users.delete.data');
});
