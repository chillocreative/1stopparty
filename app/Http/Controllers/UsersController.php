<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UsersController extends Controller
{
    public function index()
    {
        $users = User::with('role')->get();
        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    public function show(User $user)
    {
        return response()->json([
            'success' => true,
            'data' => $user->load('role')
        ]);
    }
}
