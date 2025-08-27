<?php

namespace App\Http\Controllers;

use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class EventController extends Controller
{
    /**
     * Display a listing of events.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Event::with(['creator']);

        // Filter by category if provided
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Filter by date range if provided
        if ($request->has('from_date')) {
            $query->where('event_date', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->where('event_date', '<=', $request->to_date);
        }

        $events = $query->orderBy('event_date', 'asc')
                       ->orderBy('event_time', 'asc')
                       ->paginate(15);
        
        return response()->json([
            'success' => true,
            'data' => EventResource::collection($events->items()),
            'meta' => [
                'current_page' => $events->currentPage(),
                'per_page' => $events->perPage(),
                'total' => $events->total(),
                'last_page' => $events->lastPage(),
            ],
        ]);
    }

    /**
     * Store a newly created event.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'location' => 'required|string',
            'event_date' => 'required|date',
            'event_time' => 'required',
            'category' => 'required|in:Cabang,AMK,Wanita',
            'created_by' => 'required|exists:users,id',
        ]);

        $event = Event::create($validated);
        $event->load(['creator']);

        return response()->json([
            'success' => true,
            'message' => 'Event created successfully',
            'data' => new EventResource($event),
        ], 201);
    }

    /**
     * Display the specified event.
     */
    public function show(Event $event): JsonResponse
    {
        $event->load(['creator']);
        
        return response()->json([
            'success' => true,
            'data' => new EventResource($event),
        ]);
    }

    /**
     * Update the specified event.
     */
    public function update(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'location' => 'required|string',
            'event_date' => 'required|date',
            'event_time' => 'required',
            'category' => 'required|in:Cabang,AMK,Wanita',
        ]);

        $event->update($validated);
        $event->load(['creator']);

        return response()->json([
            'success' => true,
            'message' => 'Event updated successfully',
            'data' => new EventResource($event),
        ]);
    }

    /**
     * Remove the specified event.
     */
    public function destroy(Event $event): JsonResponse
    {
        $event->delete();

        return response()->json([
            'success' => true,
            'message' => 'Event deleted successfully',
        ]);
    }
}