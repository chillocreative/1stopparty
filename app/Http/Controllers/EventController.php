<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class EventController extends Controller
{
    /**
     * Display a listing of the events.
     */
    public function index(): JsonResponse
    {
        try {
            $events = Event::with(['category', 'creator'])
                ->orderBy('event_date', 'desc')
                ->orderBy('event_time', 'desc')
                ->get()
                ->map(function ($event) {
                    return [
                        'id' => $event->id,
                        'title' => $event->title,
                        'description' => $event->description,
                        'location' => $event->location,
                        'event_date' => $event->event_date->format('Y-m-d'),
                        'event_time' => $event->event_time,
                        'category' => $event->category ? [
                            'id' => $event->category->id,
                            'name' => $event->category->name,
                            'color' => $event->category->color,
                        ] : null,
                        'created_by' => $event->creator ? [
                            'id' => $event->creator->id,
                            'name' => $event->creator->name,
                        ] : null,
                        'created_at' => $event->created_at,
                        'updated_at' => $event->updated_at,
                    ];
                });

            return response()->json($events);
        } catch (\Exception $e) {
            Log::error('Error fetching events: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch events'], 500);
        }
    }

    /**
     * Store a newly created event in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'location' => 'required|string|max:255',
                'event_date' => 'required|date|after_or_equal:today',
                'event_time' => 'required|string|regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/',
                'category_id' => 'nullable|exists:event_categories,id',
            ]);

            $validated['created_by'] = Auth::id();

            $event = Event::create($validated);
            $event->load(['category', 'creator']);

            return response()->json([
                'message' => 'Event created successfully',
                'event' => [
                    'id' => $event->id,
                    'title' => $event->title,
                    'description' => $event->description,
                    'location' => $event->location,
                    'event_date' => $event->event_date->format('Y-m-d'),
                    'event_time' => $event->event_time,
                    'category' => $event->category ? [
                        'id' => $event->category->id,
                        'name' => $event->category->name,
                        'color' => $event->category->color,
                    ] : null,
                    'created_by' => $event->creator ? [
                        'id' => $event->creator->id,
                        'name' => $event->creator->name,
                    ] : null,
                    'created_at' => $event->created_at,
                    'updated_at' => $event->updated_at,
                ]
            ], 201);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error creating event: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create event'], 500);
        }
    }

    /**
     * Display the specified event.
     */
    public function show(Event $event): JsonResponse
    {
        try {
            $event->load(['category', 'creator']);
            
            return response()->json([
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'location' => $event->location,
                'event_date' => $event->event_date->format('Y-m-d'),
                'event_time' => $event->event_time,
                'category' => $event->category ? [
                    'id' => $event->category->id,
                    'name' => $event->category->name,
                    'color' => $event->category->color,
                ] : null,
                'created_by' => $event->creator ? [
                    'id' => $event->creator->id,
                    'name' => $event->creator->name,
                ] : null,
                'created_at' => $event->created_at,
                'updated_at' => $event->updated_at,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching event: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch event'], 500);
        }
    }

    /**
     * Update the specified event in storage.
     */
    public function update(Request $request, Event $event): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'location' => 'required|string|max:255',
                'event_date' => 'required|date',
                'event_time' => 'required|string|regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/',
                'category_id' => 'nullable|exists:event_categories,id',
            ]);

            $event->update($validated);
            $event->load(['category', 'creator']);

            return response()->json([
                'message' => 'Event updated successfully',
                'event' => [
                    'id' => $event->id,
                    'title' => $event->title,
                    'description' => $event->description,
                    'location' => $event->location,
                    'event_date' => $event->event_date->format('Y-m-d'),
                    'event_time' => $event->event_time,
                    'category' => $event->category ? [
                        'id' => $event->category->id,
                        'name' => $event->category->name,
                        'color' => $event->category->color,
                    ] : null,
                    'created_by' => $event->creator ? [
                        'id' => $event->creator->id,
                        'name' => $event->creator->name,
                    ] : null,
                    'created_at' => $event->created_at,
                    'updated_at' => $event->updated_at,
                ]
            ]);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error updating event: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update event'], 500);
        }
    }

    /**
     * Remove the specified event from storage.
     */
    public function destroy(Event $event): JsonResponse
    {
        try {
            $eventTitle = $event->title;
            $event->delete();

            return response()->json([
                'message' => "Event '{$eventTitle}' has been deleted successfully."
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting event: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete event'], 500);
        }
    }
}