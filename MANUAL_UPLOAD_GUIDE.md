# Manual Upload Guide - Fix Phone Number Field

Since npm is not available on your production server, you need to manually upload these files via cPanel File Manager.

## Files to Upload

### 1. Main Component File (MOST IMPORTANT)
**File:** `resources/js/pages/CreateUser.jsx`
**Upload to:** `/home/keadilan/sys.keadilankb.com/resources/js/pages/`

### 2. Built Assets (Contains the actual fix)
**Files:**
- `public/build/assets/app-BOdRHqtZ.js`
- `public/build/assets/app-B5Ap1u0I.css`
- `public/build/manifest.json`

**Upload to:** `/home/keadilan/sys.keadilankb.com/public/build/assets/`

## Step-by-Step Upload Instructions

### Step 1: Access cPanel File Manager
1. Login to cPanel
2. Click "File Manager"
3. Navigate to `/home/keadilan/sys.keadilankb.com`

### Step 2: Upload CreateUser.jsx
1. Navigate to `resources/js/pages/`
2. Find the existing `CreateUser.jsx` file
3. Right-click and select "Delete" (or rename to `CreateUser.jsx.backup`)
4. Click "Upload" button
5. Upload the new `CreateUser.jsx` from your local computer
6. Extract if needed

### Step 3: Upload Built Assets
1. Navigate to `public/build/`
2. If the folder doesn't exist, create it: Right-click → "Create Folder" → name it "build"
3. Inside the build folder, create "assets" folder if it doesn't exist
4. Upload these 3 files to `public/build/assets/`:
   - `app-BOdRHqtZ.js`
   - `app-B5Ap1u0I.css`
5. Upload `manifest.json` to `public/build/` (not in assets folder)

### Step 4: Clear Caches
Run these commands in cPanel Terminal:
```bash
cd /home/keadilan/sys.keadilankb.com
php artisan config:clear
php artisan cache:clear
php artisan view:clear
```

## Alternative: Upload via ZIP

If uploading individual files is difficult:

1. I can create a ZIP file with all the necessary files
2. Upload the ZIP to your server root
3. Extract it in cPanel File Manager
4. The files will be placed in the correct locations

## File Locations Summary

```
/home/keadilan/sys.keadilankb.com/
├── resources/js/pages/CreateUser.jsx
├── public/build/manifest.json
└── public/build/assets/
    ├── app-BOdRHqtZ.js
    └── app-B5Ap1u0I.css
```

## Verification

After upload, test by:
1. Going to Create User page
2. Try typing in the phone number field
3. Should now accept any 10-11 digit number

If it still doesn't work, clear browser cache (Ctrl+F5) and try again.