# Deployment Troubleshooting Guide

## Login Error on Subdomain (sys.keadilankb.com)

### Problem
Getting error "We couldn't send this request at the moment. Please try again later" when trying to login.

### Root Causes & Solutions

#### 1. Session Configuration Issues
The main issue is that Laravel sessions are not properly configured for subdomain deployment.

**Solution:**
Update your `.env` file on the server with these critical settings:

```env
# CRITICAL: Set your app URL to the subdomain
APP_URL=https://sys.keadilankb.com

# CRITICAL: Configure session for subdomain
SESSION_DOMAIN=.keadilankb.com  # Note the dot prefix for subdomain compatibility
SESSION_SECURE_COOKIE=true       # Required for HTTPS
SESSION_SAME_SITE=lax           # Allows cross-site requests
SESSION_PATH=/                   # Root path
SESSION_DRIVER=database          # Or 'file' if database not working
```

#### 2. Database Session Table Missing
If using `SESSION_DRIVER=database`, ensure the sessions table exists.

**Solution:**
SSH into your server and run:
```bash
php artisan session:table
php artisan migrate --force
```

Or manually create the sessions table:
```sql
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3. CSRF Token Mismatch
The CSRF token might not be properly transmitted due to domain mismatch.

**Solution:**
1. Clear all caches:
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

2. Then rebuild caches:
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

#### 4. File Permissions
Ensure proper permissions for session storage:

```bash
# For file-based sessions
chmod -R 775 storage/framework/sessions
chown -R www-data:www-data storage/framework/sessions

# For all storage folders
chmod -R 775 storage
chmod -R 775 bootstrap/cache
```

#### 5. HTTPS/SSL Issues
If your subdomain uses HTTPS but Laravel thinks it's HTTP:

**Solution:**
Add to your `.env`:
```env
FORCE_HTTPS=true
```

Or update `app/Providers/AppServiceProvider.php`:
```php
public function boot()
{
    if (config('app.env') === 'production') {
        \URL::forceScheme('https');
    }
}
```

### Quick Checklist for Deployment

1. **Update .env file** with production values (use `.env.production` as template)
2. **Generate application key**: `php artisan key:generate`
3. **Run migrations**: `php artisan migrate --force`
4. **Clear and cache config**:
   ```bash
   php artisan config:clear
   php artisan config:cache
   php artisan route:cache
   php artisan view:clear
   ```
5. **Set file permissions**:
   ```bash
   chmod -R 775 storage bootstrap/cache
   ```
6. **Build frontend assets**:
   ```bash
   npm install
   npm run build
   ```
7. **Test the application**:
   - Try accessing `/debug/auth` to check authentication status
   - Check browser console for JavaScript errors
   - Check Laravel logs at `storage/logs/laravel.log`

### Alternative Session Drivers

If database sessions don't work, try these alternatives:

1. **File-based sessions** (simpler, works on most hosts):
   ```env
   SESSION_DRIVER=file
   ```

2. **Cookie-based sessions** (no server storage needed):
   ```env
   SESSION_DRIVER=cookie
   ```

### Debugging Commands

Run these on the server to diagnose issues:

```bash
# Check Laravel configuration
php artisan config:show session

# Test database connection
php artisan tinker
>>> DB::connection()->getPdo();

# Check if sessions table exists
php artisan tinker
>>> Schema::hasTable('sessions');

# View current environment
php artisan env
```

### cPanel Specific Settings

For cPanel deployments, ensure:

1. PHP version is 8.2 or higher
2. Required PHP extensions are enabled:
   - pdo_mysql
   - mbstring
   - openssl
   - tokenizer
   - xml
   - ctype
   - json
   - bcmath

3. Add to `.htaccess` in public folder:
   ```apache
   <IfModule mod_rewrite.c>
       RewriteEngine On
       
       # Force HTTPS
       RewriteCond %{HTTPS} off
       RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]
       
       # Handle Laravel routing
       RewriteRule ^(.*)$ index.php/$1 [L]
   </IfModule>
   ```

### Contact Support

If issues persist after trying these solutions:
1. Check Laravel logs: `storage/logs/laravel.log`
2. Check browser console for JavaScript errors
3. Enable debug mode temporarily: `APP_DEBUG=true` (remember to disable after debugging)
4. Check PHP error logs in cPanel error log viewer