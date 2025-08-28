<?php

namespace App\Http\Controllers;

use App\Models\AISettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class AISettingsController extends Controller
{
    /**
     * Get current AI settings
     */
    public function index()
    {
        $settings = AISettings::first();
        
        if (!$settings) {
            return response()->json([
                'success' => true,
                'settings' => [
                    'deepseek_api_key' => '',
                    'deepseek_base_url' => 'https://api.deepseek.com',
                    'model' => 'deepseek-chat',
                    'max_tokens' => 2000,
                    'temperature' => 0.7,
                ]
            ]);
        }

        // Don't expose the actual API key, just indicate if it exists
        $settingsData = $settings->toArray();
        $settingsData['deepseek_api_key'] = $settings->deepseek_api_key ? str_repeat('*', 20) : '';
        
        return response()->json([
            'success' => true,
            'settings' => $settingsData
        ]);
    }

    /**
     * Store or update AI settings
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'deepseek_api_key' => 'required|string',
            'deepseek_base_url' => 'required|url',
            'model' => 'required|string|in:deepseek-chat,deepseek-coder',
            'max_tokens' => 'required|integer|min:1|max:8000',
            'temperature' => 'required|numeric|min:0|max:2',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $settings = AISettings::updateSettings([
                'deepseek_api_key' => $request->deepseek_api_key,
                'deepseek_base_url' => $request->deepseek_base_url,
                'model' => $request->model,
                'max_tokens' => $request->max_tokens,
                'temperature' => $request->temperature,
                'is_active' => true
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Settings saved successfully',
                'settings' => $settings->makeHidden(['deepseek_api_key'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save settings: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test API connection
     */
    public function testConnection(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'deepseek_api_key' => 'required|string',
            'deepseek_base_url' => 'required|url',
            'model' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid API configuration'
            ], 422);
        }

        try {
            // Test the API with a simple request
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $request->deepseek_api_key,
                'Content-Type' => 'application/json',
            ])->timeout(10)->post($request->deepseek_base_url . '/chat/completions', [
                'model' => $request->model,
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => 'Hello, please respond with "API connection successful"'
                    ]
                ],
                'max_tokens' => 50,
                'temperature' => 0.7
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                // Check if response has expected structure
                if (isset($data['choices'][0]['message']['content'])) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Connection successful! Deepseek API is working properly.',
                        'response' => $data['choices'][0]['message']['content']
                    ]);
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unexpected API response format'
                    ]);
                }
            } else {
                $errorData = $response->json();
                $errorMessage = $errorData['error']['message'] ?? 'Unknown API error';
                
                return response()->json([
                    'success' => false,
                    'message' => 'API Error: ' . $errorMessage
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Check if API is configured
     */
    public function checkConfiguration()
    {
        return response()->json([
            'success' => true,
            'configured' => AISettings::isConfigured()
        ]);
    }
}