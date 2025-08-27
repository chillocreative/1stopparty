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
- **Frontend dev**: `npm run dev`
- **Run tests**: `composer test` (runs `php artisan test`)
- **Code formatting**: `./vendor/bin/pint` (Laravel Pint)

### Database Operations
- **Run migrations**: `php artisan migrate`
- **Refresh database**: `php artisan migrate:refresh --seed`
- **Create migration**: `php artisan make:migration create_table_name`
- **Create model**: `php artisan make:model ModelName -m` (includes migration)
- **Database**: MySQL (database: `1stopparty`)

## Architecture Overview

This is a Laravel 12 application for party/event management with a React frontend setup. The system follows Laravel MVC patterns with API endpoints.

### Key Architecture Patterns
- **Backend**: Laravel 12 REST API with role-based access control
- **Frontend**: React with Vite build system and Tailwind CSS
- **Database**: MySQL with SQLite for testing
- **File handling**: Local storage with upload support for documents (PDF, DOCX, XLS, CSV)

### Core Module Structure
Based on ARCHITECTURE.md, the system has these main modules:
- **Dashboard**: Statistics and graphs (monthly/yearly data)
- **Users**: CRUD operations with role assignment
- **Meetings**: CRUD with file upload capabilities
- **Events**: CRUD with category filtering by user role
- **Members**: CRUD with Excel/CSV import/export
- **Profile Settings**: User profile management

### Database Schema (Key Tables)
- `users` → Authentication with role-based permissions
- `roles` → Role definitions (Admin, Anggota Cabang, Bendahari, etc.)
- `meetings` → Meeting management with file attachments
- `events` → Events categorized by role (Cabang/AMK/Wanita)
- `members` → Member database with import functionality
- `finances` → Financial transaction tracking

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
- `app/Http/Controllers/` → API controllers
- `app/Models/` → Eloquent models
- `database/migrations/` → Database schema
- `routes/web.php` → Web routes
- `routes/api.php` → API routes (when added)

### Frontend Assets
- `resources/js/` → React components and JavaScript
- `resources/css/` → Stylesheets (Tailwind CSS)
- `resources/views/` → Blade templates
- `public/` → Static assets

### Configuration
- `vite.config.js` → Frontend build configuration
- `composer.json` → PHP dependencies and scripts
- `package.json` → Node.js dependencies
- `phpunit.xml` → Testing configuration

## Development Notes

### Testing Setup
- Uses PHPUnit for backend tests
- Test database: SQLite in-memory
- Run tests with `composer test`

### Code Style
- Laravel Pint for PHP formatting (PSR-12 standard)
- Tailwind CSS for styling
- Follow Laravel conventions for naming (PascalCase for models, snake_case for database)

### Role-Based Features
When implementing features, consider the role system outlined in ROLES.md. Different user roles have different permissions and access to various modules.