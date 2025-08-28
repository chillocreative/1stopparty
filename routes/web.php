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

// Meeting Categories API routes for React frontend (using web sessions)
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/api/meeting-categories', [App\Http\Controllers\MeetingCategoryController::class, 'index']);
    Route::post('/api/meeting-categories', [App\Http\Controllers\MeetingCategoryController::class, 'store'])->middleware('role:Admin');
    Route::get('/api/meeting-categories/{meetingCategory}', [App\Http\Controllers\MeetingCategoryController::class, 'show']);
    Route::put('/api/meeting-categories/{meetingCategory}', [App\Http\Controllers\MeetingCategoryController::class, 'update'])->middleware('role:Admin');
    Route::patch('/api/meeting-categories/{meetingCategory}', [App\Http\Controllers\MeetingCategoryController::class, 'update'])->middleware('role:Admin');
    Route::delete('/api/meeting-categories/{meetingCategory}', [App\Http\Controllers\MeetingCategoryController::class, 'destroy'])->middleware('role:Admin');
});

// Event Categories API routes for React frontend (using web sessions)
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/api/event-categories', [App\Http\Controllers\EventCategoryController::class, 'index']);
    Route::post('/api/event-categories', [App\Http\Controllers\EventCategoryController::class, 'store'])->middleware('role:Admin');
    Route::get('/api/event-categories/{eventCategory}', [App\Http\Controllers\EventCategoryController::class, 'show']);
    Route::put('/api/event-categories/{eventCategory}', [App\Http\Controllers\EventCategoryController::class, 'update'])->middleware('role:Admin');
    Route::patch('/api/event-categories/{eventCategory}', [App\Http\Controllers\EventCategoryController::class, 'update'])->middleware('role:Admin');
    Route::delete('/api/event-categories/{eventCategory}', [App\Http\Controllers\EventCategoryController::class, 'destroy'])->middleware('role:Admin');
});

// Events API routes for React frontend (using web sessions) 
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/api/events', [App\Http\Controllers\EventController::class, 'index']);
    Route::post('/api/events', [App\Http\Controllers\EventController::class, 'store'])->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
    Route::get('/api/events/{event}', [App\Http\Controllers\EventController::class, 'show']);
    Route::put('/api/events/{event}', [App\Http\Controllers\EventController::class, 'update'])->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
    Route::patch('/api/events/{event}', [App\Http\Controllers\EventController::class, 'update'])->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
    Route::delete('/api/events/{event}', [App\Http\Controllers\EventController::class, 'destroy'])->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');
});



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

        // Create event_categories table
        $results[] = "Creating event_categories table...";
        try {
            $createCategoriesTable = "
            CREATE TABLE IF NOT EXISTS event_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL UNIQUE,
                description TEXT,
                color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )";
            
            $pdo->exec($createCategoriesTable);
            $results[] = "Event categories table created successfully!";
        } catch (PDOException $e) {
            $results[] = "Error creating event_categories table: " . $e->getMessage();
        }

        // Update events table to add category_id column
        try {
            $pdo->exec("ALTER TABLE events ADD COLUMN category_id INTEGER REFERENCES event_categories(id) ON DELETE SET NULL");
            $results[] = "Added category_id column to events table!";
        } catch (PDOException $e) {
            $results[] = "Category_id column may already exist: " . $e->getMessage();
        }

        // Seed event categories
        $results[] = "Seeding event categories...";
        $categories = [
            ['name' => 'Program Cabang', 'description' => 'Events related to branch programs and activities', 'color' => '#3B82F6'],
            ['name' => 'Program Wanita', 'description' => 'Women\'s programs and activities', 'color' => '#EC4899'],
            ['name' => 'Program AMK', 'description' => 'AMK programs and activities', 'color' => '#10B981'],
            ['name' => 'Program Ahli Majlis', 'description' => 'Council member programs and activities', 'color' => '#F59E0B'],
            ['name' => 'Program MPKK', 'description' => 'MPKK programs and activities', 'color' => '#8B5CF6'],
            ['name' => 'Program JPWK', 'description' => 'JPWK programs and activities', 'color' => '#EF4444'],
            ['name' => 'Program JBPP', 'description' => 'JBPP programs and activities', 'color' => '#06B6D4'],
        ];

        foreach ($categories as $category) {
            try {
                $stmt = $pdo->prepare("INSERT OR IGNORE INTO event_categories (name, description, color) VALUES (?, ?, ?)");
                $stmt->execute([$category['name'], $category['description'], $category['color']]);
                $results[] = "Added category: " . $category['name'];
            } catch (PDOException $e) {
                $results[] = "Error adding category " . $category['name'] . ": " . $e->getMessage();
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

// Temporary debug route for event categories setup
Route::get('/debug-events-setup', function () {
    try {
        $pdo = new PDO('sqlite:database/database.sqlite');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $results = [];
        $results[] = "Checking existing tables...";
        
        $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll();
        
        foreach ($tables as $table) {
            $results[] = "Table: " . $table['name'];
        }

        // Check if event_categories table exists
        try {
            $result = $pdo->query("SELECT COUNT(*) FROM event_categories")->fetchColumn();
            $results[] = "Event categories table exists with $result rows";
        } catch (Exception $e) {
            $results[] = "Event categories table does not exist - creating it...";
            
            // Create the table
            $createTable = "
            CREATE TABLE event_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL UNIQUE,
                description TEXT,
                color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )";
            
            $pdo->exec($createTable);
            $results[] = "Event categories table created!";
            
            // Insert default categories
            $categories = [
                ['Program Cabang', 'Events related to branch programs and activities', '#3B82F6'],
                ['Program Wanita', 'Women\'s programs and activities', '#EC4899'],
                ['Program AMK', 'AMK programs and activities', '#10B981'],
                ['Program Ahli Majlis', 'Council member programs and activities', '#F59E0B'],
                ['Program MPKK', 'MPKK programs and activities', '#8B5CF6'],
                ['Program JPWK', 'JPWK programs and activities', '#EF4444'],
                ['Program JBPP', 'JBPP programs and activities', '#06B6D4'],
            ];
            
            foreach ($categories as $category) {
                $stmt = $pdo->prepare("INSERT INTO event_categories (name, description, color) VALUES (?, ?, ?)");
                $stmt->execute($category);
                $results[] = "Added category: " . $category[0];
            }
        }

        // Also add category_id to events table if it doesn't exist
        try {
            $pdo->query("SELECT category_id FROM events LIMIT 1");
            $results[] = "Events table already has category_id column";
        } catch (Exception $e) {
            $results[] = "Adding category_id column to events table...";
            try {
                $pdo->exec("ALTER TABLE events ADD COLUMN category_id INTEGER REFERENCES event_categories(id) ON DELETE SET NULL");
                $results[] = "Added category_id column to events table!";
            } catch (Exception $e2) {
                $results[] = "Error adding category_id: " . $e2->getMessage();
            }
        }

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

    // Meeting Categories Routes (Admin only)
    Route::get('/meeting-categories', function () {
        return view('dashboard');
    })->name('meeting-categories.index')->middleware('role:Admin');
});

// Events Routes - All users can view, specific roles can manage
Route::middleware('auth')->group(function () {
    // View routes
    Route::get('/events', function () {
        return view('dashboard');
    })->name('events.index');

    Route::get('/events/create', function () {
        return view('dashboard');
    })->name('events.create')->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');

    Route::get('/events/edit/{event?}', function () {
        return view('dashboard');
    })->name('events.edit')->middleware('role:Admin,Bendahari,Setiausaha,Setiausaha Pengelola,AMK,Wanita');

    // Event Categories Routes (Admin only)
    Route::get('/event-categories', function () {
        return view('dashboard');
    })->name('event-categories.index')->middleware('role:Admin');
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

    Route::get('/meeting-categories', function () {
        return view('dashboard');
    })->name('meeting-categories.index');

    // Web API routes for users data (to avoid API middleware issues)
    Route::get('/users/data', [App\Http\Controllers\UsersController::class, 'index'])->name('users.data');
    Route::get('/users/{user}/data', [App\Http\Controllers\UsersController::class, 'show'])->name('users.show.data');
    Route::post('/users/store', [App\Http\Controllers\UserController::class, 'store'])->name('users.store.data');
    Route::put('/users/{user}/update', [App\Http\Controllers\UserController::class, 'update'])->name('users.update.data');
    Route::delete('/users/{user}/delete', [App\Http\Controllers\UserController::class, 'destroy'])->name('users.delete.data');
});
