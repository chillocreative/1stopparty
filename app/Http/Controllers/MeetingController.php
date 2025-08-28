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
        $meetings = Meeting::with(['creator', 'role', 'category'])
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
                'category_id' => 'nullable|exists:meeting_categories,id',
                'date' => 'required|date|after_or_equal:today',
                'time' => 'required',
                'minit_mesyuarat_file' => 'nullable|file|mimes:pdf,doc,docx,xlsx|max:10240', // 10MB max
                'penyata_kewangan_file' => 'nullable|file|mimes:pdf,doc,docx,xlsx|max:10240', // 10MB max
                'aktiviti_file' => 'nullable|file|mimes:pdf,doc,docx,xlsx|max:10240', // 10MB max
            ]);

            // Handle file uploads
            $filePaths = [
                'minit_mesyuarat_file' => null,
                'penyata_kewangan_file' => null,
                'aktiviti_file' => null
            ];

            foreach ($filePaths as $fileField => $value) {
                if ($request->hasFile($fileField)) {
                    $file = $request->file($fileField);
                    $fileName = time() . '_' . $fileField . '_' . $file->getClientOriginalName();
                    $filePaths[$fileField] = $file->storeAs('meeting_files', $fileName, 'public');
                }
            }

            $meetingData = [
                'title' => $validated['title'],
                'category_id' => $validated['category_id'] ?? null,
                'date' => $validated['date'],
                'time' => $validated['time'],
                'minit_mesyuarat_file' => $filePaths['minit_mesyuarat_file'],
                'penyata_kewangan_file' => $filePaths['penyata_kewangan_file'],
                'aktiviti_file' => $filePaths['aktiviti_file'],
                'created_by' => $user->id,
                'role_id' => $user->role_id,
            ];

            $meeting = Meeting::create($meetingData);
            $meeting->load(['creator', 'role', 'category']);

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
        $meeting->load(['creator', 'role', 'category']);

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
            'category_id' => 'nullable|exists:meeting_categories,id',
            'date' => 'required|date',
            'time' => 'required',
            'minit_mesyuarat_file' => 'nullable|file|mimes:pdf,doc,docx,xlsx|max:10240', // 10MB max
            'penyata_kewangan_file' => 'nullable|file|mimes:pdf,doc,docx,xlsx|max:10240', // 10MB max
            'aktiviti_file' => 'nullable|file|mimes:pdf,doc,docx,xlsx|max:10240', // 10MB max
        ]);

        // Handle file uploads
        $filePaths = [
            'minit_mesyuarat_file' => $meeting->minit_mesyuarat_file, // Keep existing files by default
            'penyata_kewangan_file' => $meeting->penyata_kewangan_file,
            'aktiviti_file' => $meeting->aktiviti_file
        ];

        foreach ($filePaths as $fileField => $currentPath) {
            if ($request->hasFile($fileField)) {
                // Delete old file if exists
                if ($currentPath) {
                    Storage::disk('public')->delete($currentPath);
                }

                $file = $request->file($fileField);
                $fileName = time() . '_' . $fileField . '_' . $file->getClientOriginalName();
                $filePaths[$fileField] = $file->storeAs('meeting_files', $fileName, 'public');
            }
        }

        $meetingData = [
            'title' => $validated['title'],
            'category_id' => $validated['category_id'] ?? null,
            'date' => $validated['date'],
            'time' => $validated['time'],
            'minit_mesyuarat_file' => $filePaths['minit_mesyuarat_file'],
            'penyata_kewangan_file' => $filePaths['penyata_kewangan_file'],
            'aktiviti_file' => $filePaths['aktiviti_file'],
        ];

        $meeting->update($meetingData);
        $meeting->load(['creator', 'role', 'category']);

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
        // Delete associated files if they exist
        $filesToDelete = [
            $meeting->minit_mesyuarat_file,
            $meeting->penyata_kewangan_file,
            $meeting->aktiviti_file
        ];

        foreach ($filesToDelete as $filePath) {
            if ($filePath) {
                Storage::disk('public')->delete($filePath);
            }
        }

        $meeting->delete();

        return response()->json([
            'success' => true,
            'message' => 'Meeting deleted successfully',
        ]);
    }

    /**
     * Bulk delete multiple meetings.
     */
    public function bulkDestroy(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'ids' => 'required|array|min:1',
                'ids.*' => 'required|integer|exists:meetings,id'
            ]);

            $meetingIds = $validated['ids'];
            
            // Get meetings with their files
            $meetings = Meeting::whereIn('id', $meetingIds)->get();
            
            // Delete associated files
            foreach ($meetings as $meeting) {
                $filesToDelete = [
                    $meeting->minit_mesyuarat_file,
                    $meeting->penyata_kewangan_file,
                    $meeting->aktiviti_file
                ];

                foreach ($filesToDelete as $filePath) {
                    if ($filePath) {
                        Storage::disk('public')->delete($filePath);
                    }
                }
            }
            
            // Bulk delete meetings
            $deletedCount = Meeting::whereIn('id', $meetingIds)->delete();

            return response()->json([
                'success' => true,
                'message' => "{$deletedCount} meeting(s) deleted successfully",
                'deleted_count' => $deletedCount
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error bulk deleting meetings: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting meetings: ' . $e->getMessage(),
            ], 500);
        }
    }
}
