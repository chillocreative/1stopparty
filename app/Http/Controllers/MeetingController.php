<?php

namespace App\Http\Controllers;

use App\Http\Resources\MeetingResource;
use App\Models\Meeting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class MeetingController extends Controller
{
    /**
     * Display a listing of meetings.
     */
    public function index(): JsonResponse
    {
        $meetings = Meeting::with(['creator', 'role'])
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->get(); // Changed from paginate to get() for simplicity
        
        return response()->json([
            'success' => true,
            'data' => MeetingResource::collection($meetings),
        ]);
    }

    /**
     * Store a newly created meeting.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Check if user is authenticated
            if (!Auth::check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You must be logged in to create meetings.',
                ], 401);
            }

            // Check if user has role_id
            $user = Auth::user();
            if (!$user->role_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'User role is not properly configured.',
                ], 403);
            }

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'date' => 'required|date|after_or_equal:today',
                'time' => 'required',
                'minit_mesyuarat_file' => 'nullable|file|mimes:pdf,doc,docx|max:10240', // 10MB max
            ]);

            // Handle file upload
            $filePath = null;
            if ($request->hasFile('minit_mesyuarat_file')) {
                $file = $request->file('minit_mesyuarat_file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('meeting_files', $fileName, 'public');
            }

            $meetingData = [
                'title' => $validated['title'],
                'date' => $validated['date'],
                'time' => $validated['time'],
                'minit_mesyuarat_file' => $filePath,
                'created_by' => $user->id,
                'role_id' => $user->role_id,
            ];

            $meeting = Meeting::create($meetingData);
            $meeting->load(['creator', 'role']);

            return response()->json([
                'success' => true,
                'message' => 'Meeting created successfully',
                'data' => new MeetingResource($meeting),
            ], 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating meeting: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating the meeting: ' . $e->getMessage(),
            ], 500);
        }
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
            'time' => 'required',
            'minit_mesyuarat_file' => 'nullable|file|mimes:pdf,doc,docx|max:10240', // 10MB max
        ]);

        // Handle file upload
        $filePath = $meeting->minit_mesyuarat_file; // Keep existing file by default
        if ($request->hasFile('minit_mesyuarat_file')) {
            // Delete old file if exists
            if ($meeting->minit_mesyuarat_file) {
                Storage::disk('public')->delete($meeting->minit_mesyuarat_file);
            }
            
            $file = $request->file('minit_mesyuarat_file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('meeting_files', $fileName, 'public');
        }

        $meetingData = [
            'title' => $validated['title'],
            'date' => $validated['date'],
            'time' => $validated['time'],
            'minit_mesyuarat_file' => $filePath,
        ];

        $meeting->update($meetingData);
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
        // Delete associated file if exists
        if ($meeting->minit_mesyuarat_file) {
            Storage::disk('public')->delete($meeting->minit_mesyuarat_file);
        }
        
        $meeting->delete();

        return response()->json([
            'success' => true,
            'message' => 'Meeting deleted successfully',
        ]);
    }
}