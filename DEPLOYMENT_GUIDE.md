# Production Deployment Guide

This guide shows you how to deploy the finance PDF fix and other changes to your cPanel production server.

## Option 1: SSH Deployment (Recommended)

If you have SSH access to your server:

```bash
# SSH into your server
ssh keadilan@sys.keadilankb.com

# Navigate to your website directory
cd /home/keadilan/sys.keadilankb.com

# Pull latest changes
git pull origin master

# Run the deployment script
php deploy_production.php
```

## Option 2: File Manager Upload

If you don't have SSH access, follow these steps:

### Step 1: Download Changed Files
Download these files from your local development:
- `app/Http/Controllers/FinanceController.php`
- `app/Models/Finance.php`
- `routes/api.php`
- `resources/js/pages/ViewFinances.jsx`
- `fix_storage_production.php`
- `deploy_production.php`

### Step 2: Upload via cPanel File Manager
1. Login to cPanel
2. Open "File Manager"
3. Navigate to your website directory (usually `public_html` or similar)
4. Upload each file to its corresponding location:
   - `app/Http/Controllers/FinanceController.php` → `app/Http/Controllers/`
   - `app/Models/Finance.php` → `app/Models/`
   - `routes/api.php` → `routes/`
   - `resources/js/pages/ViewFinances.jsx` → `resources/js/pages/`
   - `fix_storage_production.php` → root directory
   - `deploy_production.php` → root directory

### Step 3: Run Deployment Script
1. In cPanel File Manager, navigate to your root directory
2. Right-click on `deploy_production.php`
3. Select "Code Editor" or use Terminal if available
4. Run: `php deploy_production.php`

## Option 3: Manual Commands

If you need to run commands manually via cPanel Terminal or SSH:

```bash
# Clear caches
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Cache configurations
php artisan config:cache
php artisan route:cache

# Fix storage symlink
php artisan storage:link --force

# Create necessary directories
mkdir -p storage/app/public/finance_files
mkdir -p storage/app/public/profile_images
chmod 755 storage/app/public/finance_files
chmod 755 storage/app/public/profile_images

# Run storage diagnostic
php fix_storage_production.php

# Build frontend assets (if Node.js is available)
npm install --production
npm run build
```

## Troubleshooting

### If you get "Command not found" errors:
- Use full paths: `/usr/bin/php` instead of `php`
- Use: `/opt/cpanel/composer/bin/composer` instead of `composer`

### If symlink creation fails:
- Check if your hosting provider supports symlinks
- Use the alternative method in `fix_storage_production.php`

### If routes don't work:
- Make sure to clear route cache: `php artisan route:clear`
- Then cache routes: `php artisan route:cache`

### If frontend doesn't update:
- Clear browser cache
- Run `npm run build` if you have Node.js access
- Upload the built files from `public/build/` directory

## Verification

After deployment, test these URLs:
- `https://sys.keadilankb.com/api/finances` (should show finance list)
- `https://sys.keadilankb.com/api/finances/1/view-file` (should show PDF if file exists)

The finance PDF viewing should now work correctly!