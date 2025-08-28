<?php

namespace App\Http\Controllers;

use App\Models\EventCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class EventCategoryController extends Controller
{
    /**
     * Display a listing of the event categories.
     */
    public function index(): JsonResponse
    {
        try {
            $categories = EventCategory::orderBy('name')->get();
            return response()->json($categories);
        } catch (\Exception $e) {
            Log::error('Error fetching event categories: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch event categories'], 500);
        }
    }

    /**
     * Store a newly created event category in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:event_categories,name',
                'description' => 'nullable|string|max:1000',
                'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            ]);

            // Set default color if not provided
            if (!isset($validated['color'])) {
                $validated['color'] = '#3B82F6'; // Default blue
            }

            $category = EventCategory::create($validated);

            return response()->json($category, 201);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error creating event category: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create event category'], 500);
        }
    }

    /**
     * Display the specified event category.
     */
    public function show(EventCategory $eventCategory): JsonResponse
    {
        try {
            return response()->json($eventCategory);
        } catch (\Exception $e) {
            Log::error('Error fetching event category: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch event category'], 500);
        }
    }

    /**
     * Update the specified event category in storage.
     */
    public function update(Request $request, EventCategory $eventCategory): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:event_categories,name,' . $eventCategory->id,
                'description' => 'nullable|string|max:1000',
                'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            ]);

            $eventCategory->update($validated);

            return response()->json($eventCategory);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error updating event category: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update event category'], 500);
        }
    }

    /**
     * Remove the specified event category from storage.
     */
    public function destroy(EventCategory $eventCategory): JsonResponse
    {
        try {
            // Check if there are events using this category
            $eventCount = $eventCategory->events()->count();

            if ($eventCount > 0) {
                return response()->json([
                    'error' => "Cannot delete category '{$eventCategory->name}' because it is being used by {$eventCount} event(s). Please reassign or delete those events first."
                ], 409);
            }

            $categoryName = $eventCategory->name;
            $eventCategory->delete();

            return response()->json([
                'message' => "Event category '{$categoryName}' has been deleted successfully."
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting event category: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete event category'], 500);
        }
    }
}
