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
                Storage::delete($user->profile_image);
            }

            // Store new image
            $path = $request->file('profile_image')->store('profile-images', 'public');
            $user->profile_image = $path;
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }
}
