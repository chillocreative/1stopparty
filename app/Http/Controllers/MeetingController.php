<?php

namespace App\Http\Controllers;

use App\Http\Resources\MeetingResource;
use App\Models\Meeting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MeetingController extends Controller
{
    /**
     * Display a listing of meetings.
     */
    public function index(): JsonResponse
    {
        $meetings = Meeting::with(['creator', 'role'])
            ->orderBy('date', 'desc')
            ->paginate(15);
        
        return response()->json([
            'success' => true,
            'data' => MeetingResource::collection($meetings->items()),
            'meta' => [
                'current_page' => $meetings->currentPage(),
                'per_page' => $meetings->perPage(),
                'total' => $meetings->total(),
                'last_page' => $meetings->lastPage(),
            ],
        ]);
    }

    /**
     * Store a newly created meeting.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'file_path' => 'nullable|string',
            'created_by' => 'required|exists:users,id',
            'role_id' => 'required|exists:roles,id',
        ]);

        $meeting = Meeting::create($validated);
        $meeting->load(['creator', 'role']);

        return response()->json([
            'success' => true,
            'message' => 'Meeting created successfully',
            'data' => new MeetingResource($meeting),
        ], 201);
    }

    /**
     * Display the specified meeting.
     */
    public function show(Meeting $meeting): JsonResponse
    {
        $meeting->load(['creator', 'role']);
        
        return response()->json([
            'success' => true,
            'data' => new MeetingResource($meeting),
        ]);
    }

    /**
     * Update the specified meeting.
     */
    public function update(Request $request, Meeting $meeting): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'file_path' => 'nullable|string',
            'role_id' => 'required|exists:roles,id',
        ]);

        $meeting->update($validated);
        $meeting->load(['creator', 'role']);

        return response()->json([
            'success' => true,
            'message' => 'Meeting updated successfully',
            'data' => new MeetingResource($meeting),
        ]);
    }

    /**
     * Remove the specified meeting.
     */
    public function destroy(Meeting $meeting): JsonResponse
    {
        $meeting->delete();

        return response()->json([
            'success' => true,
            'message' => 'Meeting deleted successfully',
        ]);
    }
}