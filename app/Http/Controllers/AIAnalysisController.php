<?php

namespace App\Http\Controllers;

use App\Models\AISettings;
use App\Models\User;
use App\Models\Meeting;
use App\Models\Event;
use App\Models\Member;
use App\Models\Finance;
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
            'dashboard_data' => 'sometimes|array',
            'stream' => 'sometimes|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid request data'
            ], 422);
        }

        // Check if API is configured
        $settings = AISettings::getActive();
        if (!$settings) {
            return response()->json([
                'success' => false,
                'message' => 'AI API is not configured. Please configure your API settings.'
            ], 400);
        }

        // Check if streaming is requested
        $useStream = $request->get('stream', false);
        
        // If streaming is requested, use the streaming endpoint
        if ($useStream) {
            return $this->streamChat($request);
        }

        try {
            // Get comprehensive dashboard data for Robot MADANI
            $dashboardData = $this->getDashboardData();
            
            // Build system prompt with dashboard context
            $systemPrompt = $this->buildSystemPrompt($dashboardData);
            
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

            // Make API request based on provider
            if ($apiConfig['provider'] === 'openai') {
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
            } else {
                // Deepseek API request - explicitly set stream to false for non-streaming
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
            }

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
                // Get more detailed error information
                $errorData = $response->json();
                $errorMessage = $errorData['error']['message'] ?? 'Unknown API error';
                $statusCode = $response->status();
                
                // Log the full error for debugging
                \Log::error($apiConfig['provider'] . ' API Error', [
                    'provider' => $apiConfig['provider'],
                    'status_code' => $statusCode,
                    'response_body' => $response->body(),
                    'error_data' => $errorData,
                    'request_data' => [
                        'model' => $apiConfig['model'],
                        'max_tokens' => $apiConfig['max_tokens'],
                        'temperature' => $apiConfig['temperature']
                    ]
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'AI API Error (HTTP ' . $statusCode . '): ' . $errorMessage
                ], 500);
            }
        } catch (\Exception $e) {
            // Log the actual error for debugging
            \Log::error('AI Analysis Error: ' . $e->getMessage(), [
                'user_message' => $request->message,
                'error' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'I encountered an error while processing your request. Please try again or check your API settings. Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle streaming chat with AI for real-time responses
     */
    public function streamChat(Request $request)
    {
        $settings = AISettings::getActive();
        if (!$settings) {
            return response()->json([
                'success' => false,
                'message' => 'AI API is not configured.'
            ], 400);
        }

        // Get comprehensive dashboard data for Robot MADANI
        $dashboardData = $this->getDashboardData();
        
        // Build system prompt with dashboard context
        $systemPrompt = $this->buildSystemPrompt($dashboardData);
        
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

        return response()->stream(function () use ($apiConfig, $messages) {
            // Set up headers for streaming
            echo "data: " . json_encode(['type' => 'start']) . "\n\n";
            ob_flush();
            flush();

            try {
                // Use Laravel's HTTP client with streaming
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $apiConfig['api_key'],
                    'Content-Type' => 'application/json',
                ])->withOptions([
                    'stream' => true,
                    'timeout' => 60
                ])->post($apiConfig['base_url'] . '/chat/completions', [
                    'model' => $apiConfig['model'],
                    'messages' => $messages,
                    'max_tokens' => $apiConfig['max_tokens'],
                    'temperature' => $apiConfig['temperature'],
                    'stream' => true
                ]);

                // Get the underlying PSR-7 response
                $body = $response->toPsrResponse()->getBody();
                $buffer = '';

                while (!$body->eof()) {
                    $chunk = $body->read(1024);
                    $buffer .= $chunk;
                    
                    // Process complete lines
                    while (($pos = strpos($buffer, "\n")) !== false) {
                        $line = substr($buffer, 0, $pos);
                        $buffer = substr($buffer, $pos + 1);
                        
                        if (trim($line) === '') {
                            continue;
                        }
                        
                        if (strpos($line, 'data: ') === 0) {
                            $data = substr($line, 6);
                            
                            if (trim($data) === '[DONE]') {
                                echo "data: " . json_encode(['type' => 'done']) . "\n\n";
                                ob_flush();
                                flush();
                                break 2;
                            }
                            
                            $json = json_decode($data, true);
                            if ($json && isset($json['choices'][0]['delta']['content'])) {
                                $content = $json['choices'][0]['delta']['content'];
                                echo "data: " . json_encode([
                                    'type' => 'content',
                                    'content' => $content
                                ]) . "\n\n";
                                ob_flush();
                                flush();
                            }
                        }
                    }
                }

                echo "data: " . json_encode(['type' => 'done']) . "\n\n";
                ob_flush();
                flush();

            } catch (\Exception $e) {
                echo "data: " . json_encode([
                    'type' => 'error',
                    'message' => 'Stream error: ' . $e->getMessage()
                ]) . "\n\n";
                ob_flush();
                flush();
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no'
        ]);
    }

    /**
     * Build system prompt with dashboard context
     */
    private function buildSystemPrompt($dashboardData = null)
    {
        $settings = AISettings::getActive();
        $apiConfig = $settings ? $settings->getApiConfig() : ['provider' => 'unknown'];
        $providerName = $apiConfig['provider'] === 'openai' ? 'OpenAI' : 'Deepseek';
        
        $prompt = "Saya Robot MADANI, asisten AI komprehensif untuk sistem pengurusan parti politik '1 Stop Party System'. Saya pakar dalam TIGA bidang utama:\n\n";
        
        $prompt .= "🎯 BIDANG 1: ANALISA DATA SISTEM (AKSES PENUH DATABASE)\n";
        $prompt .= "Saya mempunyai akses LENGKAP kepada data berikut:\n\n";
        $prompt .= "📊 DATA PENGGUNA (USERS):\n";
        $prompt .= "- Semua maklumat pengguna: nama, email, IC, telefon, peranan\n";
        $prompt .= "- Analisa pengagihan peranan dan aktiviti pengguna\n";
        $prompt .= "- Trend pendaftaran dan pengguna aktif\n";
        $prompt .= "- Status kelengkapan data pengguna\n\n";
        $prompt .= "👥 DATA AHLI (MEMBERS):\n";
        $prompt .= "- Semua ahli: maklumat peribadi, status keahlian\n";
        $prompt .= "- Pengagihan mengikut cawangan, kaum, jantina\n";
        $prompt .= "- Status kelulusan dan permohonan tertangguh\n";
        $prompt .= "- Trend keahlian dan analisa demografi\n\n";
        $prompt .= "🏢 DATA MESYUARAT (MEETINGS):\n";
        $prompt .= "- Semua mesyuarat: tarikh, masa, lokasi, kategori\n";
        $prompt .= "- Analisa mengikut pencipta dan peranan\n";
        $prompt .= "- Mesyuarat akan datang vs yang telah berlalu\n";
        $prompt .= "- Status fail minit, kewangan, dan aktiviti\n\n";
        $prompt .= "🎉 DATA ACARA (EVENTS):\n";
        $prompt .= "- Semua acara: butiran lengkap dan penjadwalan\n";
        $prompt .= "- Analisa mengikut pencipta dan sayap parti\n";
        $prompt .= "- Trend acara bulanan dan tahunan\n";
        $prompt .= "- Acara akan datang vs yang telah selesai\n\n";
        $prompt .= "💰 DATA KEWANGAN (FINANCES):\n";
        $prompt .= "- Semua transaksi kewangan: wang masuk, wang keluar, baki\n";
        $prompt .= "- Analisa mengikut bulan dan tahun\n";
        $prompt .= "- Trend kewangan dan aliran tunai\n";
        $prompt .= "- Status fail dan pemuat naik dokumen\n";
        $prompt .= "- Analisa kesihatan kewangan parti\n\n";
        $prompt .= "📈 ANALISA LANJUTAN:\n";
        $prompt .= "- Perbandingan data merentas jadual\n";
        $prompt .= "- Analisa trend masa dan corak aktiviti\n";
        $prompt .= "- Kesihatan sistem dan kelengkapan data\n";
        $prompt .= "- Cadangan strategik berdasarkan data sebenar\n\n";
        
        $prompt .= "🇲🇾 BIDANG 2: POLITIK MALAYSIA KOMPREHENSIF\n";
        $prompt .= "Saya boleh menjawab soalan tentang:\n";
        $prompt .= "- SEMUA aspek politik Malaysia (bukan hanya MADANI)\n";
        $prompt .= "- Kawasan Parlimen: 222 kerusi Dewan Rakyat\n";
        $prompt .= "- Dewan Undangan Negeri (DUN): semua negeri\n";
        $prompt .= "- Daerah Mengundi dan pusat mengundi\n";
        $prompt .= "- Keputusan Pilihanraya Umum (PRU) terdahulu (PRU15, PRU14, PRU13, dll)\n";
        $prompt .= "- Keputusan Pilihanraya Negeri (PRN) semua negeri\n";
        $prompt .= "- Pilihanraya Kecil (PRK) dan analisa trend\n";
        $prompt .= "- Perbandingan keputusan pilihanraya mengikut kawasan dan tempoh\n";
        $prompt .= "- Parti politik Malaysia dan kepimpinan\n";
        $prompt .= "- Dasar kerajaan dan pembangkang\n";
        $prompt .= "- Isu-isu politik semasa dan sejarah\n\n";
        
        $prompt .= "🔍 BIDANG 3: ANALISA DAN INTERPRETASI LANJUTAN\n";
        $prompt .= "Saya boleh:\n";
        $prompt .= "- Mencari maklumat politik terkini dari web jika diperlukan\n";
        $prompt .= "- Membuat analisa perbandingan data pilihanraya\n";
        $prompt .= "- Memberikan interpretasi trend politik dan electoral\n";
        $prompt .= "- Menganalisa corak pengundian mengikut demografi\n";
        $prompt .= "- Memberikan cadangan strategi berdasarkan data\n";
        $prompt .= "- Bertanya balik untuk mendapatkan konteks yang lebih tepat\n\n";
        
        $prompt .= "💬 GAYA INTERAKSI SAYA:\n";
        $prompt .= "- Saya akan bertanya balik jika perlu penjelasan lebih lanjut\n";
        $prompt .= "- Saya proaktif mencadangkan analisa tambahan yang berkaitan\n";
        $prompt .= "- Saya akan menanyakan samada pengguna mahu tahu maklumat lain yang berkaitan\n";
        $prompt .= "- Saya menggunakan data terkini dan boleh rujuk sumber web jika perlu\n\n";
        
        $prompt .= "⚠️ BATASAN:\n";
        $prompt .= "- Saya HANYA menjawab tentang: Data Dashboard, Politik Malaysia, dan Pilihanraya\n";
        $prompt .= "- Saya TIDAK menjawab topik lain seperti: teknologi am, sains, kesihatan, hiburan, sukan\n";
        $prompt .= "- Jika soalan di luar skop, saya akan arahkan kembali kepada topik yang betul\n\n";

        if ($dashboardData && is_array($dashboardData)) {
            $prompt .= "=== DATA SISTEM TERKINI UNTUK ANALISA ===\n\n";
            
            if (isset($dashboardData['users'])) {
                $prompt .= "📊 MAKLUMAT PENGGUNA:\n";
                $prompt .= "- Jumlah Pengguna: " . $dashboardData['users']['total_count'] . "\n";
                if (isset($dashboardData['users']['roles_distribution'])) {
                    $prompt .= "- Pengagihan Peranan: " . json_encode($dashboardData['users']['roles_distribution']) . "\n";
                }
                $prompt .= "- Pendaftaran 30 Hari: " . ($dashboardData['users']['recent_registrations'] ?? 0) . "\n";
                $prompt .= "- Pengguna Aktif (7 hari): " . ($dashboardData['users']['active_users'] ?? 0) . "\n\n";
            }
            
            if (isset($dashboardData['members'])) {
                $prompt .= "👥 MAKLUMAT AHLI:\n";
                $prompt .= "- Jumlah Ahli: " . $dashboardData['members']['total_count'] . "\n";
                $prompt .= "- Ahli Diluluskan: " . ($dashboardData['members']['approved_members'] ?? 0) . "\n";
                $prompt .= "- Ahli Tertangguh: " . ($dashboardData['members']['pending_members'] ?? 0) . "\n";
                $prompt .= "- Permohonan Baru (30 hari): " . ($dashboardData['members']['recent_applications'] ?? 0) . "\n";
                if (isset($dashboardData['members']['members_by_branch'])) {
                    $prompt .= "- Mengikut Cawangan: " . json_encode($dashboardData['members']['members_by_branch']) . "\n";
                }
                $prompt .= "\n";
            }
            
            if (isset($dashboardData['meetings'])) {
                $prompt .= "🏢 MAKLUMAT MESYUARAT:\n";
                $prompt .= "- Jumlah Mesyuarat: " . $dashboardData['meetings']['total_count'] . "\n";
                $prompt .= "- Mesyuarat Akan Datang: " . ($dashboardData['meetings']['upcoming_meetings'] ?? 0) . "\n";
                $prompt .= "- Mesyuarat Lepas: " . ($dashboardData['meetings']['past_meetings'] ?? 0) . "\n";
                $prompt .= "- Mesyuarat dengan Fail: " . ($dashboardData['meetings']['meetings_with_files'] ?? 0) . "\n";
                if (isset($dashboardData['meetings']['meetings_by_category'])) {
                    $prompt .= "- Mengikut Kategori: " . json_encode($dashboardData['meetings']['meetings_by_category']) . "\n";
                }
                $prompt .= "\n";
            }
            
            if (isset($dashboardData['events'])) {
                $prompt .= "🎉 MAKLUMAT ACARA:\n";
                $prompt .= "- Jumlah Acara: " . $dashboardData['events']['total_count'] . "\n";
                $prompt .= "- Acara Akan Datang: " . ($dashboardData['events']['upcoming_events'] ?? 0) . "\n";
                $prompt .= "- Acara Lepas: " . ($dashboardData['events']['past_events'] ?? 0) . "\n";
                if (isset($dashboardData['events']['events_by_month'])) {
                    $prompt .= "- Acara Bulanan: " . json_encode($dashboardData['events']['events_by_month']) . "\n";
                }
                $prompt .= "\n";
            }
            
            if (isset($dashboardData['finances'])) {
                $prompt .= "💰 MAKLUMAT KEWANGAN:\n";
                $prompt .= "- Jumlah Transaksi: " . $dashboardData['finances']['total_count'] . "\n";
                $prompt .= "- Wang Masuk (RM): " . number_format($dashboardData['finances']['total_wang_masuk'], 2) . "\n";
                $prompt .= "- Wang Keluar (RM): " . number_format($dashboardData['finances']['total_wang_keluar'], 2) . "\n";
                $prompt .= "- Baki Semasa (RM): " . number_format($dashboardData['finances']['current_baki'], 2) . "\n";
                $prompt .= "- Transaksi Baru (30 hari): " . ($dashboardData['finances']['recent_transactions'] ?? 0) . "\n";
                $prompt .= "- Rekod dengan Fail: " . ($dashboardData['finances']['finances_with_files'] ?? 0) . "\n";
                $prompt .= "\n";
            }
            
            if (isset($dashboardData['analytics'])) {
                $prompt .= "📈 ANALISA SISTEM:\n";
                $prompt .= "- Jumlah Rekod: " . ($dashboardData['analytics']['system_health']['total_records'] ?? 0) . "\n";
                $prompt .= "- Aktiviti Terkini: " . ($dashboardData['analytics']['system_health']['recent_activity'] ?? 0) . "\n";
                $prompt .= "\n";
            }
            
            $prompt .= "NOTA: Saya ada akses PENUH kepada data terperinci dari SEMUA jadual:\n";
            $prompt .= "- View All Users: Setiap pengguna dengan peranan dan maklumat peribadi\n";
            $prompt .= "- View All Members: Setiap ahli dengan demografi dan status keahlian\n";
            $prompt .= "- View All Meetings: Setiap mesyuarat dengan fail dan kategori\n";
            $prompt .= "- View All Events: Setiap acara dengan tarikh dan penganjur\n";
            $prompt .= "- View Finances: Setiap transaksi kewangan dengan wang masuk/keluar\n\n";
        }

        // Add detailed context about the system
        $prompt .= "System Context:\n";
        $prompt .= "- The system manages 8 user roles: Admin, Bendahari (Treasurer), Setiausaha (Secretary), Setiausaha Pengelola (Managing Secretary), AMK (Youth Wing), Wanita (Women's Wing), AJK Cabang (Branch Committee), and Anggota Biasa (Regular Members)\n";
        $prompt .= "- Meetings can be categorized by wing (Cabang/Branch, Wanita/Women, AMK/Youth)\n";
        $prompt .= "- Events are organized by different party wings and committees\n";
        $prompt .= "- The system tracks member engagement and participation\n\n";

        $prompt .= "📋 PANDUAN RESPONS DAN INTERAKSI:\n";
        $prompt .= "1. PERIKSA SKOP: Pastikan soalan berkaitan dashboard data, politik Malaysia, atau pilihanraya\n";
        $prompt .= "2. JAWAB KOMPREHENSIF: Berikan analisa mendalam dan maklumat yang relevan\n";
        $prompt .= "3. BERTANYA BALIK: Tanya pengguna jika mereka mahu tahu aspek lain yang berkaitan\n";
        $prompt .= "   Contoh: \"Adakah anda ingin saya analisa trend pilihanraya di kawasan lain juga?\"\n";
        $prompt .= "   Contoh: \"Mahu saya bandingkan dengan keputusan PRU yang lalu?\"\n";
        $prompt .= "4. CADANG ANALISA: Proaktif mencadangkan analisa tambahan yang berguna\n";
        $prompt .= "5. GUNAKAN DATA WEB: Jika perlu maklumat terkini, nyatakan anda boleh cari dari web\n";
        $prompt .= "6. BAHASA MALAYSIA: Gunakan BM sebagai bahasa utama, tapi boleh campur BI jika perlu\n";
        $prompt .= "7. KONTEKS BERTERUSAN: Sambung konteks dalam conversation yang sama\n\n";
        
        $prompt .= "CONTOH INTERAKSI YANG BAIK:\n";
        $prompt .= "Pengguna: 'Siapa menang di Selangor PRU15?'\n";
        $prompt .= "Robot MADANI: 'Pakatan Harapan menang majoriti di Selangor pada PRU15 dengan 55 kerusi DUN... [analisa detail]. Adakah anda mahu saya bandingkan dengan keputusan PRU14? Atau mahu tahu keputusan kawasan Parlimen tertentu di Selangor?'\n\n";
        
        $prompt .= "Pengguna: 'Berapa mesyuarat bulan ini?'\n";
        $prompt .= "Robot MADANI: 'Berdasarkan data dashboard, terdapat X mesyuarat bulan ini... [analisa]. Mahu saya analisa jenis mesyuarat atau trend kehadiran juga?'\n\n";

        $prompt .= "JIKA SOALAN DI LUAR SKOP, jawab: 'Maaf, saya Robot MADANI hanya pakar dalam analisa data dashboard sistem, politik Malaysia, dan pilihanraya. Sila tanya tentang topik-topik ini - saya boleh bantu dengan analisa yang mendalam!'\n\n";

        $prompt .= "SENTIASA PROAKTIF: Tunjukkan keupayaan analisa yang luas dalam bidang kepakaran saya.";

        return $prompt;
    }

    /**
     * Get comprehensive database data for AI context
     */
    private function getDashboardData()
    {
        try {
            $data = [];
            
            // USERS DATA - Complete analysis
            $users = User::with('role')->get();
            $data['users'] = [
                'total_count' => $users->count(),
                'roles_distribution' => $users->groupBy('role.name')->map->count()->toArray(),
                'recent_registrations' => $users->where('created_at', '>=', now()->subDays(30))->count(),
                'active_users' => $users->where('updated_at', '>=', now()->subDays(7))->count(),
                'users_by_role' => $users->map(function($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role ? $user->role->name : 'No Role',
                        'ic_number' => $user->ic_number ?? 'Not provided',
                        'phone' => $user->phone ?? 'Not provided',
                        'created_at' => $user->created_at->format('Y-m-d'),
                        'last_active' => $user->updated_at->format('Y-m-d')
                    ];
                })->toArray()
            ];
            
            // MEMBERS DATA - Complete member information
            if (class_exists('\App\Models\Member')) {
                $members = \App\Models\Member::all();
                $data['members'] = [
                    'total_count' => $members->count(),
                    'approved_members' => $members->where('status', 'approved')->count(),
                    'pending_members' => $members->where('status', 'pending')->count(),
                    'recent_applications' => $members->where('created_at', '>=', now()->subDays(30))->count(),
                    'members_by_branch' => $members->whereNotNull('branch')->groupBy('branch')->map->count()->toArray(),
                    'members_by_race' => $members->whereNotNull('race')->groupBy('race')->map->count()->toArray(),
                    'members_by_gender' => $members->whereNotNull('gender')->groupBy('gender')->map->count()->toArray(),
                    'detailed_members' => $members->map(function($member) {
                        return [
                            'id' => $member->id,
                            'name' => $member->name,
                            'ic_no' => $member->ic_no ?? 'Not provided',
                            'phone' => $member->phone ?? 'Not provided',
                            'member_no' => $member->member_no ?? 'Not assigned',
                            'branch' => $member->branch ?? 'Not specified',
                            'race' => $member->race ?? 'Not specified',
                            'gender' => $member->gender ?? 'Not specified',
                            'status' => $member->status ?? 'pending',
                            'joined_date' => $member->created_at->format('Y-m-d')
                        ];
                    })->toArray()
                ];
            }
            
            // MEETINGS DATA - Complete meeting analysis
            $meetings = Meeting::with(['creator', 'role', 'category'])->get();
            $data['meetings'] = [
                'total_count' => $meetings->count(),
                'recent_meetings' => $meetings->where('created_at', '>=', now()->subDays(30))->count(),
                'meetings_by_category' => $meetings->whereNotNull('category.name')->groupBy('category.name')->map->count()->toArray(),
                'meetings_by_creator_role' => $meetings->whereNotNull('role.name')->groupBy('role.name')->map->count()->toArray(),
                'upcoming_meetings' => $meetings->where('date', '>=', now()->format('Y-m-d'))->count(),
                'past_meetings' => $meetings->where('date', '<', now()->format('Y-m-d'))->count(),
                'meetings_with_files' => $meetings->whereNotNull('minit_mesyuarat_file')->count(),
                'detailed_meetings' => $meetings->map(function($meeting) {
                    return [
                        'id' => $meeting->id,
                        'title' => $meeting->title,
                        'date' => $meeting->date,
                        'time' => $meeting->time,
                        'location' => $meeting->location ?? 'Not specified',
                        'category' => $meeting->category ? $meeting->category->name : 'Uncategorized',
                        'creator' => $meeting->creator ? $meeting->creator->name : 'Unknown',
                        'creator_role' => $meeting->role ? $meeting->role->name : 'No role',
                        'description' => substr($meeting->description ?? '', 0, 100) . '...',
                        'has_minutes_file' => !empty($meeting->minit_mesyuarat_file),
                        'has_financial_file' => !empty($meeting->penyata_kewangan_file),
                        'has_activity_file' => !empty($meeting->aktiviti_file),
                        'created_date' => $meeting->created_at->format('Y-m-d')
                    ];
                })->toArray()
            ];
            
            // EVENTS DATA - Complete event information
            $events = Event::with(['creator', 'role'])->get();
            $data['events'] = [
                'total_count' => $events->count(),
                'recent_events' => $events->where('created_at', '>=', now()->subDays(30))->count(),
                'events_by_creator_role' => $events->whereNotNull('role.name')->groupBy('role.name')->map->count()->toArray(),
                'upcoming_events' => $events->where('date', '>=', now()->format('Y-m-d'))->count(),
                'past_events' => $events->where('date', '<', now()->format('Y-m-d'))->count(),
                'events_by_month' => $events->groupBy(function($event) {
                    return \Carbon\Carbon::parse($event->date)->format('Y-m');
                })->map->count()->toArray(),
                'detailed_events' => $events->map(function($event) {
                    return [
                        'id' => $event->id,
                        'title' => $event->title,
                        'date' => $event->date,
                        'time' => $event->time ?? 'Not specified',
                        'location' => $event->location ?? 'Not specified',
                        'creator' => $event->creator ? $event->creator->name : 'Unknown',
                        'creator_role' => $event->role ? $event->role->name : 'No role',
                        'description' => substr($event->description ?? '', 0, 100) . '...',
                        'created_date' => $event->created_at->format('Y-m-d')
                    ];
                })->toArray()
            ];
            
            // FINANCES DATA - Complete financial records
            $finances = Finance::with('uploader')->get();
            $data['finances'] = [
                'total_count' => $finances->count(),
                'total_wang_masuk' => $finances->sum('wang_masuk'),
                'total_wang_keluar' => $finances->sum('wang_keluar'),
                'current_baki' => $finances->latest()->first()->baki ?? 0,
                'recent_transactions' => $finances->where('created_at', '>=', now()->subDays(30))->count(),
                'finances_by_month' => $finances->groupBy(function($finance) {
                    return $finance->year . '-' . sprintf('%02d', $finance->month);
                })->map->count()->toArray(),
                'finances_by_year' => $finances->groupBy('year')->map->count()->toArray(),
                'finances_with_files' => $finances->whereNotNull('file_path')->count(),
                'detailed_finances' => $finances->map(function($finance) {
                    return [
                        'id' => $finance->id,
                        'title' => $finance->title,
                        'month' => $finance->month,
                        'year' => $finance->year,
                        'wang_masuk' => $finance->wang_masuk,
                        'wang_keluar' => $finance->wang_keluar,
                        'baki' => $finance->baki,
                        'uploader' => $finance->uploader ? $finance->uploader->name : 'Unknown',
                        'has_file' => !empty($finance->file_path),
                        'details_count' => is_array($finance->details) ? count($finance->details) : 0,
                        'created_date' => $finance->created_at->format('Y-m-d')
                    ];
                })->toArray()
            ];
            
            // SUMMARY ANALYTICS
            $data['analytics'] = [
                'system_health' => [
                    'total_records' => ($data['users']['total_count'] ?? 0) + 
                                     ($data['members']['total_count'] ?? 0) + 
                                     ($data['meetings']['total_count'] ?? 0) + 
                                     ($data['events']['total_count'] ?? 0) + 
                                     ($data['finances']['total_count'] ?? 0),
                    'recent_activity' => ($data['users']['recent_registrations'] ?? 0) + 
                                       ($data['meetings']['recent_meetings'] ?? 0) + 
                                       ($data['events']['recent_events'] ?? 0) + 
                                       ($data['finances']['recent_transactions'] ?? 0),
                    'data_completion' => [
                        'users_with_ic' => collect($data['users']['users_by_role'])->where('ic_number', '!=', 'Not provided')->count(),
                        'users_with_phone' => collect($data['users']['users_by_role'])->where('phone', '!=', 'Not provided')->count(),
                        'meetings_with_files' => $data['meetings']['meetings_with_files'] ?? 0,
                    ]
                ]
            ];
            
            return $data;
            
        } catch (\Exception $e) {
            \Log::error('Error fetching comprehensive data: ' . $e->getMessage());
            return ['error' => 'Unable to fetch complete data', 'message' => $e->getMessage()];
        }
    }
}