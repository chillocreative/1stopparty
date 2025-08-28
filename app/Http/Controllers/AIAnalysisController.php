<?php

namespace App\Http\Controllers;

use App\Models\AISettings;
use App\Models\User;
use App\Models\Meeting;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class AIAnalysisController extends Controller
{
    /**
     * Handle chat with AI for analysis
     */
    public function chat(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:2000',
            'context' => 'sometimes|array',
            'dashboard_data' => 'sometimes|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid request data'
            ], 422);
        }

        // Check if API is configured
        $settings = AISettings::getActive();
        if (!$settings || !$settings->deepseek_api_key) {
            return response()->json([
                'success' => false,
                'message' => 'AI API is not configured. Please configure your Deepseek API settings.'
            ], 400);
        }

        try {
            // Build system prompt with dashboard context
            $systemPrompt = $this->buildSystemPrompt($request->dashboard_data);
            
            // Build conversation messages
            $messages = [
                [
                    'role' => 'system',
                    'content' => $systemPrompt
                ]
            ];

            // Add context messages if provided
            if ($request->has('context') && is_array($request->context)) {
                foreach ($request->context as $contextMessage) {
                    if (isset($contextMessage['role']) && isset($contextMessage['content'])) {
                        $messages[] = [
                            'role' => $contextMessage['role'],
                            'content' => $contextMessage['content']
                        ];
                    }
                }
            }

            // Add current user message
            $messages[] = [
                'role' => 'user',
                'content' => $request->message
            ];

            // Get API configuration
            $apiConfig = $settings->getApiConfig();

            // Make API request to Deepseek
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiConfig['api_key'],
                'Content-Type' => 'application/json',
            ])->timeout(30)->post($apiConfig['base_url'] . '/chat/completions', [
                'model' => $apiConfig['model'],
                'messages' => $messages,
                'max_tokens' => $apiConfig['max_tokens'],
                'temperature' => $apiConfig['temperature'],
                'stream' => false
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['choices'][0]['message']['content'])) {
                    return response()->json([
                        'success' => true,
                        'response' => $data['choices'][0]['message']['content']
                    ]);
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unexpected API response format'
                    ], 500);
                }
            } else {
                $errorData = $response->json();
                $errorMessage = $errorData['error']['message'] ?? 'Unknown API error';
                
                return response()->json([
                    'success' => false,
                    'message' => 'AI API Error: ' . $errorMessage
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to process AI request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Build system prompt with dashboard context
     */
    private function buildSystemPrompt($dashboardData = null)
    {
        $prompt = "You are an AI analyst for a political party management system called '1 Stop Party System'. Your role is to analyze dashboard data and provide insights about the party's operations, user engagement, and system usage.\n\n";
        
        $prompt .= "You have access to the following types of data:\n";
        $prompt .= "- User statistics (total users, roles distribution)\n";
        $prompt .= "- Meeting records and scheduling\n";
        $prompt .= "- Event management data\n";
        $prompt .= "- Member registration and participation\n";
        $prompt .= "- Financial tracking (if applicable)\n\n";

        if ($dashboardData && is_array($dashboardData)) {
            $prompt .= "Current Dashboard Statistics:\n";
            foreach ($dashboardData as $key => $value) {
                $prompt .= "- " . ucfirst(str_replace('_', ' ', $key)) . ": " . $value . "\n";
            }
            $prompt .= "\n";
        }

        // Add detailed context about the system
        $prompt .= "System Context:\n";
        $prompt .= "- The system manages 8 user roles: Admin, Bendahari (Treasurer), Setiausaha (Secretary), Setiausaha Pengelola (Managing Secretary), AMK (Youth Wing), Wanita (Women's Wing), AJK Cabang (Branch Committee), and Anggota Biasa (Regular Members)\n";
        $prompt .= "- Meetings can be categorized by wing (Cabang/Branch, Wanita/Women, AMK/Youth)\n";
        $prompt .= "- Events are organized by different party wings and committees\n";
        $prompt .= "- The system tracks member engagement and participation\n\n";

        $prompt .= "Guidelines for your responses:\n";
        $prompt .= "1. Provide actionable insights and recommendations\n";
        $prompt .= "2. Use data-driven analysis when possible\n";
        $prompt .= "3. Consider political party management best practices\n";
        $prompt .= "4. Be professional and objective in your analysis\n";
        $prompt .= "5. Highlight patterns, trends, or potential issues\n";
        $prompt .= "6. Suggest improvements for better party management\n";
        $prompt .= "7. Keep responses concise but informative\n";
        $prompt .= "8. Use Malaysian political context when relevant\n\n";

        $prompt .= "Always provide helpful, accurate, and relevant analysis based on the available data.";

        return $prompt;
    }

    /**
     * Get current dashboard data for AI context
     */
    private function getDashboardData()
    {
        try {
            return [
                'total_users' => User::count(),
                'admin_users' => User::whereHas('role', function($q) { 
                    $q->where('name', 'Admin'); 
                })->count(),
                'total_meetings' => Meeting::count(),
                'recent_meetings' => Meeting::where('created_at', '>=', now()->subDays(30))->count(),
                'total_events' => Event::count(),
                'recent_events' => Event::where('created_at', '>=', now()->subDays(30))->count(),
                'roles_distribution' => User::join('roles', 'users.role_id', '=', 'roles.id')
                    ->groupBy('roles.name')
                    ->selectRaw('roles.name, count(*) as count')
                    ->pluck('count', 'name')
                    ->toArray()
            ];
        } catch (\Exception $e) {
            return [];
        }
    }
}