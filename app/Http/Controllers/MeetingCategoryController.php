<?php

namespace App\Http\Controllers;

use App\Http\Resources\MeetingCategoryResource;
use App\Models\MeetingCategory;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class MeetingCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $categories = MeetingCategory::withCount('meetings')->orderBy('name')->get();
            return response()->json([
                'data' => MeetingCategoryResource::collection($categories)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching meeting categories',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            // Debug authentication and request data
            $user = auth()->user();
            \Log::info('Category creation attempt', [
                'user_id' => $user ? $user->id : 'null',
                'user_role' => $user && $user->role ? $user->role->name : 'no role',
                'request_data' => $request->all(),
                'is_authenticated' => auth()->check()
            ]);

            if (!$user) {
                return response()->json([
                    'message' => 'User not authenticated for category creation',
                    'debug' => [
                        'auth_check' => auth()->check(),
                        'session_id' => session()->getId()
                    ]
                ], 401);
            }

            $request->validate([
                'name' => 'required|string|max:255|unique:meeting_categories,name',
                'description' => 'nullable|string',
                'is_active' => 'boolean',
            ]);

            $category = MeetingCategory::create([
                'name' => $request->name,
                'description' => $request->description,
                'is_active' => $request->is_active ?? true,
            ]);

            \Log::info('Category created successfully', ['category_id' => $category->id]);

            return response()->json([
                'data' => new MeetingCategoryResource($category),
                'message' => 'Category created successfully'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::warning('Category creation validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Category creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error creating meeting category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(MeetingCategory $meetingCategory)
    {
        try {
            $meetingCategory->loadCount('meetings');
            return new MeetingCategoryResource($meetingCategory);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching meeting category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, MeetingCategory $meetingCategory)
    {
        try {
            $request->validate([
                'name' => [
                    'required',
                    'string',
                    'max:255',
                    Rule::unique('meeting_categories', 'name')->ignore($meetingCategory->id)
                ],
                'description' => 'nullable|string',
                'is_active' => 'boolean',
            ]);

            $meetingCategory->update([
                'name' => $request->name,
                'description' => $request->description,
                'is_active' => $request->is_active ?? $meetingCategory->is_active,
            ]);

            $meetingCategory->loadCount('meetings');
            return new MeetingCategoryResource($meetingCategory);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating meeting category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MeetingCategory $meetingCategory)
    {
        try {
            // Check if category has associated meetings
            if ($meetingCategory->meetings()->count() > 0) {
                return response()->json([
                    'message' => 'Cannot delete category that has associated meetings'
                ], 409);
            }

            $meetingCategory->delete();

            return response()->json([
                'message' => 'Meeting category deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting meeting category',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
