# Role-Based Permissions Documentation

## Overview
The 1 Stop Party System implements role-based access control using middleware to restrict access to various API endpoints based on user roles.

## Default Roles

### 1. Admin
- **Full access**: Can perform all operations on all modules
- **User management**: Only role that can manage users (CRUD operations)
- **Permissions**: Access to all endpoints without restrictions

### 2. Anggota Cabang
- **View-only access**: Can view meetings, events, and members
- **No create/edit permissions**: Cannot create, update, or delete any resources
- **Dashboard access**: Can view dashboard statistics and charts

### 3. Bendahari (Treasurer)
- **Financial management**: Primary role for managing finances
- **Meeting/Event management**: Can create, edit, and manage meetings and events
- **Member management**: Can manage member database including imports

### 4. Setiausaha (Secretary)
- **Administrative role**: Focuses on meeting and event management
- **Documentation**: Can upload and manage meeting files
- **Member management**: Can manage member records

### 5. Setiausaha Pengelola (Managing Secretary)
- **Senior administrative role**: Enhanced permissions over regular Setiausaha
- **Full meeting/event access**: Can manage all meetings and events
- **Member management**: Full CRUD access to member database

### 6. AMK (Youth Wing)
- **Youth activities**: Can manage AMK category events
- **Member management**: Can add and manage members
- **Meeting participation**: Can create and manage meetings

### 7. Wanita (Women's Wing)
- **Women's activities**: Can manage Wanita category events
- **Member management**: Can add and manage members
- **Meeting participation**: Can create and manage meetings

## API Endpoint Permissions

### Dashboard Routes
- **Access**: All authenticated users
- **Endpoints**:
  - `GET /api/dashboard/cards`
  - `GET /api/dashboard/charts`

### Users Routes
- **Access**: Admin only
- **Endpoints**:
  - `GET /api/users` (list users)
  - `POST /api/users` (create user)
  - `GET /api/users/{user}` (show user)
  - `PUT/PATCH /api/users/{user}` (update user)
  - `DELETE /api/users/{user}` (delete user)

### Meetings Routes
- **View Access**: All authenticated users
  - `GET /api/meetings` (list meetings)
  - `GET /api/meetings/{meeting}` (show meeting)

- **Manage Access**: Admin, Bendahari, Setiausaha, Setiausaha Pengelola, AMK, Wanita
  - `POST /api/meetings` (create meeting)
  - `PUT/PATCH /api/meetings/{meeting}` (update meeting)
  - `DELETE /api/meetings/{meeting}` (delete meeting)

### Events Routes
- **View Access**: All authenticated users
  - `GET /api/events` (list events)
  - `GET /api/events/{event}` (show event)

- **Manage Access**: Admin, Bendahari, Setiausaha, Setiausaha Pengelola, AMK, Wanita
  - `POST /api/events` (create event)
  - `PUT/PATCH /api/events/{event}` (update event)
  - `DELETE /api/events/{event}` (delete event)

### Members Routes
- **View Access**: All authenticated users
  - `GET /api/members` (list members)
  - `GET /api/members/{member}` (show member)

- **Manage Access**: Admin, Bendahari, Setiausaha, Setiausaha Pengelola, AMK, Wanita
  - `POST /api/members` (create member)
  - `PUT/PATCH /api/members/{member}` (update member)
  - `DELETE /api/members/{member}` (delete member)
  - `POST /api/members/import` (import members)

## Middleware Implementation

### CheckRole Middleware
- **File**: `app/Http/Middleware/CheckRole.php`
- **Usage**: `->middleware('role:Admin,Bendahari')`
- **Features**:
  - Accepts multiple roles as parameters
  - Admin role bypasses all restrictions
  - Returns 403 JSON error for unauthorized access
  - Provides detailed error messages with user role and required roles

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthenticated"
}
```

#### 403 Forbidden - No Role
```json
{
  "success": false,
  "message": "User has no role assigned",
  "error_code": "NO_ROLE_ASSIGNED"
}
```

#### 403 Forbidden - Insufficient Permissions
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions.",
  "error_code": "INSUFFICIENT_PERMISSIONS",
  "user_role": "Anggota Cabang",
  "required_roles": ["Admin", "Bendahari"]
}
```

## Usage Examples

### Applying Middleware to Routes
```php
// Single role
Route::get('/admin/users', [UserController::class, 'index'])
    ->middleware('role:Admin');

// Multiple roles
Route::post('/meetings', [MeetingController::class, 'store'])
    ->middleware('role:Admin,Bendahari,Setiausaha');

// In route groups
Route::middleware(['auth:sanctum', 'role:Admin'])->group(function () {
    Route::apiResource('users', UserController::class);
});
```

### Testing Role Access
- Use tools like Postman or Insomnia
- Include `Authorization: Bearer {token}` header
- Different user tokens will have different role access levels
- Check response status codes and error messages for access validation

## Security Notes
- Always combine with authentication middleware (`auth:sanctum`)
- Admin role has universal access - assign carefully
- Role names are case-sensitive
- Users without roles are denied access to protected routes
- Middleware checks are performed on every request to protected endpoints