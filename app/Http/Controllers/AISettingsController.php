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
                    'ai_provider' => 'deepseek',
                    'deepseek_api_key' => '',
                    'deepseek_base_url' => 'https://api.deepseek.com',
                    'model' => 'deepseek-chat',
                    'openai_api_key' => '',
                    'openai_base_url' => 'https://api.openai.com/v1',
                    'openai_model' => 'gpt-4o',
                    'max_tokens' => 2000,
                    'temperature' => 0.7,
                ]
            ]);
        }

        // Don't expose the actual API keys, just indicate if they exist
        $settingsData = $settings->toArray();
        $settingsData['deepseek_api_key'] = $settings->deepseek_api_key ? str_repeat('*', 20) : '';
        $settingsData['openai_api_key'] = $settings->openai_api_key ? str_repeat('*', 20) : '';
        
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
        // Dynamic validation based on provider
        $rules = [
            'ai_provider' => 'required|string|in:deepseek,openai',
            'max_tokens' => 'required|integer|min:1|max:8000',
            'temperature' => 'required|numeric|min:0|max:2',
        ];

        if ($request->ai_provider === 'deepseek') {
            $rules['deepseek_api_key'] = 'required|string';
            $rules['deepseek_base_url'] = 'required|url';
            $rules['model'] = 'required|string|in:deepseek-chat,deepseek-coder';
        } elseif ($request->ai_provider === 'openai') {
            $rules['openai_api_key'] = 'required|string';
            $rules['openai_base_url'] = 'required|url';
            $rules['openai_model'] = 'required|string|in:gpt-4o,gpt-4o-mini,gpt-4-turbo,gpt-4,gpt-3.5-turbo';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $data = [
                'ai_provider' => $request->ai_provider,
                'max_tokens' => $request->max_tokens,
                'temperature' => $request->temperature,
                'is_active' => true
            ];

            // Add provider-specific fields
            if ($request->ai_provider === 'deepseek') {
                $data['deepseek_api_key'] = $request->deepseek_api_key;
                $data['deepseek_base_url'] = $request->deepseek_base_url;
                $data['model'] = $request->model;
            } elseif ($request->ai_provider === 'openai') {
                $data['openai_api_key'] = $request->openai_api_key;
                $data['openai_base_url'] = $request->openai_base_url;
                $data['openai_model'] = $request->openai_model;
            }

            $settings = AISettings::updateSettings($data);

            return response()->json([
                'success' => true,
                'message' => 'Settings saved successfully',
                'settings' => $settings->makeHidden(['deepseek_api_key', 'openai_api_key'])
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
        $provider = $request->input('ai_provider', 'deepseek');
        
        if ($provider === 'deepseek') {
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

            return $this->testDeepseekConnection($request);
        } else {
            $validator = Validator::make($request->all(), [
                'openai_api_key' => 'required|string',
                'openai_base_url' => 'required|url',
                'openai_model' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid API configuration'
                ], 422);
            }

            return $this->testOpenAIConnection($request);
        }
    }

    /**
     * Test Deepseek API connection
     */
    private function testDeepseekConnection(Request $request)
    {
        try {
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
                'temperature' => 0.7,
                'stream' => false
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
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
                    'message' => 'Deepseek API Error: ' . $errorMessage
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Deepseek connection failed: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Test OpenAI API connection
     */
    private function testOpenAIConnection(Request $request)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $request->openai_api_key,
                'Content-Type' => 'application/json',
            ])->timeout(10)->post($request->openai_base_url . '/chat/completions', [
                'model' => $request->openai_model,
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
                
                if (isset($data['choices'][0]['message']['content'])) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Connection successful! OpenAI API is working properly.',
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
                    'message' => 'OpenAI API Error: ' . $errorMessage
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'OpenAI connection failed: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Check if API is configured and working
     */
    public function checkConfiguration()
    {
        $isConfigured = AISettings::isConfigured();
        
        if (!$isConfigured) {
            return response()->json([
                'success' => false,
                'configured' => false,
                'message' => 'API is not configured'
            ]);
        }

        // Test actual connection
        try {
            $settings = AISettings::getActive();
            $apiConfig = $settings->getApiConfig();
            
            if ($apiConfig['provider'] === 'openai') {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $apiConfig['api_key'],
                    'Content-Type' => 'application/json',
                ])->timeout(10)->post($apiConfig['base_url'] . '/chat/completions', [
                    'model' => $apiConfig['model'],
                    'messages' => [
                        [
                            'role' => 'user',
                            'content' => 'Test connection'
                        ]
                    ],
                    'max_tokens' => 10,
                    'temperature' => 0.1
                ]);
            } else {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $apiConfig['api_key'],
                    'Content-Type' => 'application/json',
                ])->timeout(10)->post($apiConfig['base_url'] . '/chat/completions', [
                    'model' => $apiConfig['model'],
                    'messages' => [
                        [
                            'role' => 'user',
                            'content' => 'Test connection'
                        ]
                    ],
                    'max_tokens' => 10,
                    'temperature' => 0.1,
                    'stream' => false
                ]);
            }

            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['choices'][0]['message']['content'])) {
                    $providerName = $apiConfig['provider'] === 'openai' ? 'OpenAI' : 'Deepseek';
                    return response()->json([
                        'success' => true,
                        'configured' => true,
                        'message' => $providerName . ' API is configured and working properly'
                    ]);
                }
            }
            
            $errorData = $response->json();
            $errorMessage = $errorData['error']['message'] ?? 'Unknown API error';
            $providerName = $apiConfig['provider'] === 'openai' ? 'OpenAI' : 'Deepseek';
            
            return response()->json([
                'success' => false,
                'configured' => true,
                'message' => $providerName . ' API configured but connection failed: ' . $errorMessage
            ]);
            
        } catch (\Exception $e) {
            $settings = AISettings::getActive();
            $apiConfig = $settings ? $settings->getApiConfig() : ['provider' => 'unknown'];
            $providerName = $apiConfig['provider'] === 'openai' ? 'OpenAI' : 'Deepseek';
            
            return response()->json([
                'success' => false,
                'configured' => true,
                'message' => $providerName . ' API configured but connection error: ' . $e->getMessage()
            ]);
        }
    }
}