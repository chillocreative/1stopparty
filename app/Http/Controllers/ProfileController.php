<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'ic_number' => ['nullable', 'string', 'regex:/^\d{12}$/'],
            'phone' => ['nullable', 'string', 'regex:/^01[0-9]{8,9}$/'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'profile_image' => ['nullable', 'image', 'max:1024'], // max 1MB
        ]);

        // Update basic info
        $user->name = $validated['name'];
        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }
        if (isset($validated['ic_number'])) {
            $user->ic_number = $validated['ic_number'];
        }
        if (isset($validated['phone'])) {
            $user->phone = $validated['phone'];
        }

        // Update password if provided
        if (isset($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        // Handle profile image upload
        if ($request->hasFile('profile_image')) {
            // Delete old image if exists
            if ($user->profile_image) {
                // Try to delete from both possible locations
                Storage::disk('public')->delete($user->profile_image);
                
                // Also try direct public path (for production environments)
                $publicPath = public_path($user->profile_image);
                if (file_exists($publicPath)) {
                    unlink($publicPath);
                }
            }

            // Store new image
            $image = $request->file('profile_image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            
            // First try to store using Laravel's storage system
            try {
                $imagePath = $image->storeAs('profile_images', $imageName, 'public');
                $user->profile_image = $imagePath;
                
                // For production environments, also copy to public directory if symlink doesn't work
                if (!file_exists(public_path('storage/' . $imagePath))) {
                    $publicDir = public_path('profile_images');
                    if (!file_exists($publicDir)) {
                        mkdir($publicDir, 0755, true);
                    }
                    
                    // Copy file to public directory as fallback
                    copy(
                        storage_path('app/public/' . $imagePath),
                        public_path('profile_images/' . $imageName)
                    );
                    
                    // Update path to point to public directory
                    $user->profile_image = 'profile_images/' . $imageName;
                }
            } catch (\Exception $e) {
                // Fallback: store directly in public directory
                $publicDir = public_path('profile_images');
                if (!file_exists($publicDir)) {
                    mkdir($publicDir, 0755, true);
                }
                
                $image->move($publicDir, $imageName);
                $user->profile_image = 'profile_images/' . $imageName;
            }
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }
}
