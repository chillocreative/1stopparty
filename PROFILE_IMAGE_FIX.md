# Profile Image Fix for Production

The profile images showing as "Profile preview" text instead of actual images is due to storage symlink issues in production environments.

## Problem
- Profile images are stored in `storage/app/public/profile_images/`
- Laravel expects a symlink from `public/storage` to `storage/app/public`
- cPanel/shared hosting often doesn't support symlinks

## Solutions Applied

### 1. Enhanced User Model
- Updated `getProfileImageUrlAttribute()` to check multiple paths
- Uses `asset()` helper for better URL generation
- Fallback to direct public path if symlink fails

### 2. Enhanced ProfileController
- Improved file upload handling
- Copies images to `public/profile_images/` as fallback
- Handles both symlinked and direct storage methods

### 3. Diagnostic Script
- Created `fix_storage_production.php` to diagnose storage issues
- Run this script on production server to identify problems

## Quick Production Fix

### Option 1: Run Diagnostic Script
```bash
php fix_storage_production.php
```

### Option 2: Manual Commands
```bash
# Try to create storage symlink
php artisan storage:link

# If symlink fails, create directory manually
mkdir -p public/profile_images
chmod 755 public/profile_images
```

### Option 3: cPanel File Manager
1. Go to cPanel File Manager
2. Navigate to `public_html/` (or your Laravel public folder)
3. Create folder named `profile_images`
4. Set permissions to 755
5. Move any existing images from `storage/app/public/profile_images/` to `public/profile_images/`

## Verification
After applying fix:
1. Upload a new profile image
2. Check that image displays correctly
3. Verify image URL in browser developer tools

## Prevention
- The updated code automatically handles both scenarios
- New uploads will work regardless of symlink status
- Existing users may need to re-upload profile images