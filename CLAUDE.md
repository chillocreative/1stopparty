# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Start Development Environment
```bash
composer dev
```
This runs a complete development environment with:
- Laravel development server (`php artisan serve`)
- Queue worker (`php artisan queue:listen --tries=1`)
- Log viewer (`php artisan pail --timeout=0`)  
- Vite dev server (`npm run dev`)

### Individual Commands
- **Backend server**: `php artisan serve`
- **Frontend build**: `npm run build`
- **Frontend dev**: `npm run dev` (or `vite`)
- **Run tests**: `composer test` (runs `php artisan test`)
- **Code formatting**: `./vendor/bin/pint` (Laravel Pint)

### Database Operations
- **Run migrations**: `php artisan migrate`
- **Refresh database**: `php artisan migrate:refresh --seed`
- **Seed database only**: `php artisan db:seed`
- **Create migration**: `php artisan make:migration create_table_name`
- **Create model**: `php artisan make:model ModelName -m` (includes migration)
- **Database**: MySQL (database: `1stopparty`)

### Cache Management
- **Clear all caches**: `php artisan config:clear && php artisan cache:clear && php artisan route:clear && php artisan view:clear`
- **Cache config**: `php artisan config:cache`
- **Cache routes**: `php artisan route:cache`
- **Clear specific caches**:
  - Config: `php artisan config:clear`
  - Routes: `php artisan route:clear`
  - Views: `php artisan view:clear`
  - Application: `php artisan cache:clear`

### Artisan Commands
- **Create controller**: `php artisan make:controller ControllerName`
- **Create resource controller**: `php artisan make:controller ControllerName --resource`
- **Create API controller**: `php artisan make:controller ControllerName --api`
- **Create resource**: `php artisan make:resource ResourceName`
- **Create middleware**: `php artisan make:middleware MiddlewareName`
- **Create seeder**: `php artisan make:seeder SeederName`

## Architecture Overview

This is a Laravel 12 application for party/event management with a React frontend setup. The system follows Laravel MVC patterns with API endpoints.

### Key Architecture Patterns
- **Backend**: Laravel 12 REST API with role-based access control
- **Frontend**: React with Vite build system and Tailwind CSS v4
- **Database**: MySQL (production) with SQLite for testing (in-memory)
- **Authentication**: Laravel Sanctum with React context
- **File handling**: Local storage with upload support for documents (PDF, DOCX, XLS, CSV)
- **State management**: React Context API (AuthContext)

### Core Module Structure
Based on ARCHITECTURE.md, the system has these main modules:
- **Dashboard**: Statistics and graphs (monthly/yearly data)
- **Users**: CRUD operations with role assignment
- **Meetings**: CRUD with file upload capabilities
- **Events**: CRUD with category filtering by user role
- **Members**: CRUD with Excel/CSV import/export
- **Profile Settings**: User profile management

### Database Schema (Key Tables)
- `users` → Authentication with role-based permissions (includes ic_number, phone fields)
- `roles` → Role definitions with descriptions (Admin, Anggota Cabang, Bendahari, etc.)
- `meetings` → Meeting management with file attachments
- `events` → Events categorized by role (Cabang/AMK/Wanita)
- `members` → Member database with import functionality (CSV/Excel import templates available)
- `finances` → Financial transaction tracking
- `sessions` → Laravel session management

### API Structure
API endpoints follow RESTful patterns:
- `/api/auth/*` → Authentication (login, logout, register)
- `/api/users/*` → User management
- `/api/meetings/*` → Meeting management + file uploads
- `/api/events/*` → Event management
- `/api/members/*` → Member management + import/export
- `/api/dashboard/*` → Dashboard data and charts

## File Organization

### Laravel Structure
- `app/Http/Controllers/` → API controllers (User, Meeting, Event, Member, Dashboard, Profile)
- `app/Http/Resources/` → API resources for data transformation
- `app/Http/Middleware/` → Custom middleware (RoleMiddleware, CheckRole)
- `app/Models/` → Eloquent models (User, Role, Meeting, Event, Member, Finance)
- `app/Console/Commands/` → Custom Artisan commands
- `database/migrations/` → Database schema
- `database/seeders/` → Database seeders for all entities
- `database/factories/` → Model factories for testing
- `routes/web.php` → Web routes (Blade views)
- `routes/api.php` → API routes

### Frontend Assets
- `resources/js/components/` → Reusable React components
- `resources/js/components/ui/` → UI components (Button, Input, Card, Label)
- `resources/js/pages/` → Page components (Dashboard, CreateUser, EditUser, etc.)
- `resources/js/contexts/` → React contexts (AuthContext)
- `resources/css/` → Stylesheets (Tailwind CSS v4)
- `resources/views/` → Blade templates (login, register, dashboard, welcome)
- `public/` → Static assets and built files

### Configuration
- `vite.config.js` → Frontend build configuration
- `composer.json` → PHP dependencies and scripts
- `package.json` → Node.js dependencies
- `phpunit.xml` → Testing configuration

## Development Notes

### Testing Setup
- Uses PHPUnit for backend tests (Feature and Unit tests)
- Test database: SQLite in-memory (configured in phpunit.xml)
- Run tests with `composer test` (clears config first, then runs tests)
- Existing tests: ExampleTest, MeetingControllerTest

### Code Style
- Laravel Pint for PHP formatting (PSR-12 standard)
- Tailwind CSS v4 for styling
- Follow Laravel conventions for naming (PascalCase for models, snake_case for database)

### File Storage
- Member import templates available at `storage/app/templates/members_import_template.csv`
- File uploads stored in `storage/app/public/`
- Supports PDF, DOCX, XLS, CSV file formats

### Role-Based Features
When implementing features, consider the role system outlined in ROLES.md:
- **Admin**: Full system access, can assign roles
- **Anggota Cabang**: View-only access to all modules
- **Other roles** (Bendahari, Setiausaha, etc.): Can manage meetings, events, and members within their role category

### Middleware Usage
- `CheckRole` and `RoleMiddleware` for role-based access control
- Apply to routes that need permission restrictions

## Project Status and Architecture Notes

### Current Implementation Status
This is a **production-ready** Laravel 12 + React 18 party management system with the following completed modules:
- ✅ **Authentication System**: Session-based with role management
- ✅ **User Management**: Complete CRUD with profile images (Admin only)
- ✅ **Profile Management**: User profile editing with image uploads
- ✅ **Meetings Management**: Full CRUD with file upload capabilities
- ✅ **Dashboard**: Statistics display with proper icon alignment
- ✅ **Role-Based Access**: 8 user roles with granular permissions

### Key Implementation Details

#### Authentication Architecture
- Uses Laravel session-based authentication (not Sanctum as mentioned above)
- Database session driver configured in phpunit.xml
- AuthContext provides React state management
- Role-based middleware protection on routes

#### User Role System (8 Roles)
1. **Admin**: Full system access, user management
2. **Bendahari**: Financial management + standard access
3. **Setiausaha**: Administrative tasks + standard access  
4. **Setiausaha Pengelola**: Enhanced administrative access
5. **AMK**: Youth wing activities + standard access
6. **Wanita**: Women's wing activities + standard access
7. **AJK Cabang**: Enhanced standard access
8. **Anggota Biasa**: Basic member access

#### File Upload System
- Profile images: JPG/PNG, max 2MB
- Meeting files: PDF/DOC/DOCX, max 10MB
- Storage in `storage/app/public/` with proper cleanup
- Frontend validation + backend validation

#### Database Configuration
- **Production**: MySQL (`1stopparty` database)
- **Testing**: SQLite in-memory
- Session storage in database
- Comprehensive seeding system with test users

### Test Users Available
Pre-seeded test accounts (password varies by role):
- admin@1stopparty.com (password: password)
- bendahari@1stopparty.com (password: bendahari123)
- setiausaha@1stopparty.com (password: setiausaha123)
- [See summary.md for complete list]

### Development Debugging
- `/setup-database` route for automated database setup
- `/debug/auth` route for authentication debugging
- Enhanced error handling with detailed messages
- Console logging in React components for troubleshooting

## Deployment Configuration

### Production Deployment (cPanel)
The project uses `cpanel.yml` for automated deployment. The deployment process:

1. **Install PHP dependencies**: `composer install --no-dev --optimize-autoloader`
2. **Sync files**: Uses rsync to copy files (excludes `.git`, `node_modules`, `tests`)
3. **Clear and cache configurations**:
   - `php artisan config:clear && php artisan config:cache`
   - `php artisan route:cache`
   - `php artisan view:clear`
4. **Run migrations** (if needed): `php artisan migrate --force`
5. **Build frontend assets**: `npm install && npm run build`

### Production Environment Setup
- **Deploy path**: `/home/keadilan/sys.keadilankb.com`
- **PHP binary**: `/usr/bin/php` with `-d register_argc_argv=On` flag
- **Composer path**: `/opt/cpanel/composer/bin/composer`
- **NPM path**: `/bin/npm`

### Route Naming Conventions
Web routes that might conflict with API resource routes use prefixed names:
- `users.web.index` instead of `users.index` (to avoid conflicts with API resource routes)
- `roles.web.index` instead of `roles.index`
- This prevents route caching errors in production