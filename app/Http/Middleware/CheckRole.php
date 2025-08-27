<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$allowedRoles
     */
    public function handle(Request $request, Closure $next, string ...$allowedRoles): Response
    {
        // Check if user is authenticated
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        $user = $request->user();

        // Load the user's role if not already loaded
        if (!$user->relationLoaded('role')) {
            $user->load('role');
        }

        // Check if user has a role
        if (!$user->role) {
            return response()->json([
                'success' => false,
                'message' => 'User has no role assigned',
                'error_code' => 'NO_ROLE_ASSIGNED',
            ], 403);
        }

        $userRole = $user->role->name;

        // Admin can access everything
        if ($userRole === 'Admin') {
            return $next($request);
        }

        // Check if user's role is in the allowed roles list
        if (!in_array($userRole, $allowedRoles)) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Insufficient permissions.',
                'error_code' => 'INSUFFICIENT_PERMISSIONS',
                'user_role' => $userRole,
                'required_roles' => $allowedRoles,
            ], 403);
        }

        return $next($request);
    }
}