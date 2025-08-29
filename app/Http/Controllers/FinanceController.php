<?php

namespace App\Http\Controllers;

use App\Models\Finance;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Smalot\PdfParser\Parser;

class FinanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        try {
            $finances = Finance::with('uploader')
                ->orderBy('year', 'desc')
                ->orderBy('month', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $finances
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching finances: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching finances'
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'month' => 'required|integer|min:1|max:12',
                'year' => 'required|integer|min:2000|max:2100',
                'wang_masuk' => 'required|numeric|min:0',
                'wang_keluar' => 'required|numeric|min:0',
                'baki' => 'required|numeric',
                'details' => 'nullable|array',
            ]);

            // Check if record already exists for this month/year
            $exists = Finance::where('month', $validated['month'])
                ->where('year', $validated['year'])
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Finance record already exists for this month and year'
                ], 422);
            }

            $finance = Finance::create([
                'title' => $validated['title'],
                'month' => $validated['month'],
                'year' => $validated['year'],
                'wang_masuk' => $validated['wang_masuk'],
                'wang_keluar' => $validated['wang_keluar'],
                'baki' => $validated['baki'],
                'details' => $validated['details'] ?? null,
                'uploaded_by' => Auth::id(),
            ]);

            $finance->load('uploader');

            return response()->json([
                'success' => true,
                'message' => 'Finance record created successfully',
                'data' => $finance
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating finance record: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating finance record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Parse file without saving (for preview)
     */
    public function parseFile(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'file' => 'required|file|mimes:pdf,xlsx,xls|max:10240', // 10MB max
                'month' => 'required|integer|min:1|max:12',
                'year' => 'required|integer|min:2000|max:2100',
            ]);

            // Store the file temporarily
            $file = $request->file('file');
            $fileName = 'temp_finance_' . time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('temp_files', $fileName, 'public');
            $fullPath = storage_path('app/public/' . $filePath);

            // Parse file content based on file type
            $fileExtension = strtolower($file->getClientOriginalExtension());
            
            if ($fileExtension === 'pdf') {
                $content = $this->parsePdf($fullPath);
                $financialData = $this->extractFinancialData($content, $validated['month'], $validated['year']);
            } elseif (in_array($fileExtension, ['xlsx', 'xls'])) {
                $financialData = $this->parseExcel($fullPath, $validated['month'], $validated['year']);
            } else {
                throw new \Exception('Unsupported file type');
            }

            // Clean up temporary file
            Storage::disk('public')->delete($filePath);

            // Return parsed data for preview (don't save yet)
            return response()->json([
                'success' => true,
                'message' => 'File parsed successfully',
                'data' => $financialData
            ]);

        } catch (\Exception $e) {
            Log::error('Error parsing file: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error parsing file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload and parse PDF file
     */
    public function uploadPdf(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'file' => 'required|file|mimes:pdf|max:10240', // 10MB max
                'month' => 'required|integer|min:1|max:12',
                'year' => 'required|integer|min:2000|max:2100',
            ]);

            // Check if record already exists
            $exists = Finance::where('month', $validated['month'])
                ->where('year', $validated['year'])
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Finance record already exists for this month and year'
                ], 422);
            }

            // Store the PDF file
            $file = $request->file('file');
            $fileName = 'finance_' . $validated['month'] . '_' . $validated['year'] . '_' . time() . '.pdf';
            $filePath = $file->storeAs('finance_files', $fileName, 'public');

            // Parse PDF content
            $pdfContent = $this->parsePdf(storage_path('app/public/' . $filePath));

            // Extract financial data from parsed content
            $financialData = $this->extractFinancialData($pdfContent, $validated['month'], $validated['year']);

            // Create finance record
            $finance = Finance::create([
                'title' => $financialData['title'],
                'month' => $validated['month'],
                'year' => $validated['year'],
                'wang_masuk' => $financialData['wang_masuk'],
                'wang_keluar' => $financialData['wang_keluar'],
                'baki' => $financialData['baki'],
                'file_path' => $filePath,
                'details' => $financialData['details'] ?? null,
                'uploaded_by' => Auth::id(),
            ]);

            $finance->load('uploader');

            return response()->json([
                'success' => true,
                'message' => 'PDF uploaded and processed successfully',
                'data' => $finance
            ]);
        } catch (\Exception $e) {
            Log::error('Error uploading PDF: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error uploading PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Parse PDF file content
     */
    private function parsePdf($filePath): string
    {
        try {
            // For basic PHP PDF parsing without external library
            // We'll use a simple text extraction approach
            $content = '';
            
            // Try to use pdftotext if available
            $command = 'pdftotext "' . $filePath . '" -';
            $output = shell_exec($command);
            
            if ($output) {
                $content = $output;
            } else {
                // Fallback: Read raw PDF and extract text patterns
                $pdfContent = file_get_contents($filePath);
                
                // Extract text between stream markers
                preg_match_all('/stream(.*?)endstream/s', $pdfContent, $matches);
                
                foreach ($matches[1] as $stream) {
                    // Decompress if needed
                    $stream = @gzuncompress($stream);
                    if ($stream === false) {
                        $stream = $matches[1][0];
                    }
                    
                    // Extract text patterns
                    preg_match_all('/\((.*?)\)/', $stream, $textMatches);
                    foreach ($textMatches[1] as $text) {
                        $content .= $text . ' ';
                    }
                }
            }
            
            return $content;
        } catch (\Exception $e) {
            Log::error('Error parsing PDF: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Extract financial data from PDF content
     */
    private function extractFinancialData(string $content, int $month, int $year): array
    {
        $months = [
            1 => 'JANUARI', 2 => 'FEBRUARI', 3 => 'MAC', 4 => 'APRIL',
            5 => 'MEI', 6 => 'JUN', 7 => 'JULAI', 8 => 'OGOS',
            9 => 'SEPTEMBER', 10 => 'OKTOBER', 11 => 'NOVEMBER', 12 => 'DISEMBER'
        ];

        $monthName = $months[$month] ?? 'BULAN';
        $title = "PENYATA KEWANGAN KEADILAN CABANG KEPALA BATAS BULAN {$monthName} {$year}";

        // Extract Wang Masuk (Income) - Look for "JUMLAH KESELURUHAN" under WANG MASUK section
        $wangMasuk = 0;
        
        // Method 1: Look for the exact pattern in the PDF
        if (preg_match('/WANG\s+MASUK.*?JUMLAH\s+KESELURUHAN.*?([0-9,]+\.00)/si', $content, $matches)) {
            $wangMasuk = floatval(str_replace(',', '', $matches[1]));
        } 
        // Method 2: Look for pattern like "2,335.00" after WANG MASUK section
        elseif (preg_match('/WANG\s+MASUK.*?(\d{1,3}(?:,\d{3})*\.00)/si', $content, $matches)) {
            $wangMasuk = floatval(str_replace(',', '', $matches[1]));
        }

        // Extract Wang Keluar (Expenses) - Look for "JUMLAH KESELURUHAN" under WANG KELUAR section
        $wangKeluar = 0;
        
        // Method 1: Look for the exact pattern in the PDF
        if (preg_match('/WANG\s+KELUAR.*?JUMLAH\s+KESELURUHAN.*?([0-9,]+\.00)/si', $content, $matches)) {
            $wangKeluar = floatval(str_replace(',', '', $matches[1]));
        }
        // Method 2: Look for pattern after WANG KELUAR section
        elseif (preg_match('/WANG\s+KELUAR.*?(\d{1,3}(?:,\d{3})*\.00)/si', $content, $matches)) {
            $wangKeluar = floatval(str_replace(',', '', $matches[1]));
        }

        // Extract Baki directly from PDF if available
        $baki = 0;
        if (preg_match('/BAKI.*?([0-9,]+\.00)/si', $content, $matches)) {
            $baki = floatval(str_replace(',', '', $matches[1]));
        } else {
            // Calculate Baki if not found
            $baki = $wangMasuk - $wangKeluar;
        }

        // Extract detailed line items
        $details = [
            'income_items' => [],
            'expense_items' => [],
            'summary' => [
                'wang_masuk_peruntukan' => $wangMasuk,
                'wang_keluar_perbelanjaan' => $wangKeluar,
                'baki_di_tangan' => 0,
                'baki_di_bank' => 0,
                'jumlah_baki' => $baki
            ]
        ];

        // Extract income items (WANG MASUK/PERUNTUKAN section)
        if (preg_match('/WANG\s+MASUK.*?PERUNTUKAN(.*?)JUMLAH\s+KESELURUHAN/si', $content, $incomeSection)) {
            // Look for date and description patterns like "01.07.2025 Baki Di Tangan Dari Bulan Jun 2025 1,335.00"
            preg_match_all('/(\d{2}\.\d{2}\.\d{4})\s+([^0-9]+?)\s+([0-9,]+\.00)/i', $incomeSection[1], $incomeMatches, PREG_SET_ORDER);
            
            foreach ($incomeMatches as $match) {
                $details['income_items'][] = [
                    'date' => $match[1],
                    'description' => trim($match[2]),
                    'amount' => floatval(str_replace(',', '', $match[3]))
                ];
            }
        }

        // Extract expense items (WANG KELUAR/PERBELANJAAN section)
        if (preg_match('/WANG\s+KELUAR.*?PERBELANJAAN(.*?)JUMLAH\s+KESELURUHAN/si', $content, $expenseSection)) {
            // Look for date and description patterns
            preg_match_all('/(\d{2}\.\d{2}\.\d{4})\s+([^0-9]+?)\s+([0-9,]+\.00)/i', $expenseSection[1], $expenseMatches, PREG_SET_ORDER);
            
            foreach ($expenseMatches as $match) {
                $details['expense_items'][] = [
                    'date' => $match[1],
                    'description' => trim($match[2]),
                    'amount' => floatval(str_replace(',', '', $match[3]))
                ];
            }
        }

        // Extract balance details
        if (preg_match('/BAKI\s+DI\s+TANGAN.*?([0-9,]+\.00)/si', $content, $matches)) {
            $details['summary']['baki_di_tangan'] = floatval(str_replace(',', '', $matches[1]));
        }
        
        if (preg_match('/BAKI\s+DI\s+BANK.*?([0-9,]+\.00)/si', $content, $matches)) {
            $details['summary']['baki_di_bank'] = floatval(str_replace(',', '', $matches[1]));
        }

        return [
            'title' => $title,
            'wang_masuk' => $wangMasuk,
            'wang_keluar' => $wangKeluar,
            'baki' => $baki,
            'details' => $details
        ];
    }

    /**
     * Parse Excel file content
     */
    private function parseExcel(string $filePath, int $month, int $year): array
    {
        try {
            // For basic Excel parsing, we'll look for common patterns
            // In a production environment, you might want to use PhpSpreadsheet
            
            $months = [
                1 => 'JANUARI', 2 => 'FEBRUARI', 3 => 'MAC', 4 => 'APRIL',
                5 => 'MEI', 6 => 'JUN', 7 => 'JULAI', 8 => 'OGOS',
                9 => 'SEPTEMBER', 10 => 'OKTOBER', 11 => 'NOVEMBER', 12 => 'DISEMBER'
            ];

            $monthName = $months[$month] ?? 'BULAN';
            $title = "PENYATA KEWANGAN KEADILAN CABANG KEPALA BATAS BULAN {$monthName} {$year}";

            // For now, return default structure for Excel files
            // You would need to implement proper Excel reading logic here
            return [
                'title' => $title,
                'wang_masuk' => 0,
                'wang_keluar' => 0,
                'baki' => 0,
                'details' => [
                    'income_items' => [],
                    'expense_items' => [],
                    'summary' => [
                        'wang_masuk_peruntukan' => 0,
                        'wang_keluar_perbelanjaan' => 0,
                        'baki_di_tangan' => 0,
                        'baki_di_bank' => 0,
                        'jumlah_baki' => 0
                    ]
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Error parsing Excel: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Save finance data after user confirms
     */
    public function saveFinanceData(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'month' => 'required|integer|min:1|max:12',
                'year' => 'required|integer|min:2000|max:2100',
                'wang_masuk' => 'required|numeric|min:0',
                'wang_keluar' => 'required|numeric|min:0',
                'baki' => 'required|numeric',
                'details' => 'nullable|array',
                'file_data' => 'nullable|string', // Base64 encoded file data
                'file_name' => 'nullable|string', // Original file name
                'file_type' => 'nullable|string', // File type
            ]);

            // Check if record already exists for this month/year
            $exists = Finance::where('month', $validated['month'])
                ->where('year', $validated['year'])
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Finance record already exists for this month and year'
                ], 422);
            }

            $filePath = null;
            
            // Save the file if file data is provided
            if (!empty($validated['file_data']) && !empty($validated['file_name'])) {
                try {
                    // Decode base64 file data
                    $fileData = base64_decode($validated['file_data']);
                    
                    // Generate unique filename
                    $extension = pathinfo($validated['file_name'], PATHINFO_EXTENSION);
                    $fileName = 'finance_' . $validated['month'] . '_' . $validated['year'] . '_' . time() . '.' . $extension;
                    
                    // Store file in public/finance_files directory
                    $filePath = 'finance_files/' . $fileName;
                    Storage::disk('public')->put($filePath, $fileData);
                    
                } catch (\Exception $e) {
                    Log::error('Error saving file: ' . $e->getMessage());
                    // Continue without file if file save fails
                }
            }

            $finance = Finance::create([
                'title' => $validated['title'],
                'month' => $validated['month'],
                'year' => $validated['year'],
                'wang_masuk' => $validated['wang_masuk'],
                'wang_keluar' => $validated['wang_keluar'],
                'baki' => $validated['baki'],
                'details' => $validated['details'] ?? null,
                'file_path' => $filePath,
                'uploaded_by' => Auth::id(),
            ]);

            $finance->load('uploader');

            return response()->json([
                'success' => true,
                'message' => 'Finance record saved successfully',
                'data' => $finance
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error saving finance data: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error saving finance data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Finance $finance): JsonResponse
    {
        $finance->load('uploader');
        
        return response()->json([
            'success' => true,
            'data' => $finance
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Finance $finance): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'wang_masuk' => 'required|numeric|min:0',
                'wang_keluar' => 'required|numeric|min:0',
                'baki' => 'required|numeric',
                'details' => 'nullable|array',
            ]);

            $finance->update($validated);
            $finance->load('uploader');

            return response()->json([
                'success' => true,
                'message' => 'Finance record updated successfully',
                'data' => $finance
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating finance record: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating finance record'
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Finance $finance): JsonResponse
    {
        try {
            // Delete associated file if exists
            if ($finance->file_path) {
                Storage::disk('public')->delete($finance->file_path);
            }

            $finance->delete();

            return response()->json([
                'success' => true,
                'message' => 'Finance record deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting finance record: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting finance record'
            ], 500);
        }
    }

    /**
     * View/download the finance file
     */
    public function viewFile(Finance $finance): \Symfony\Component\HttpFoundation\BinaryFileResponse|\Illuminate\Http\JsonResponse
    {
        try {
            if (!$finance->file_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'No file associated with this finance record'
                ], 404);
            }

            $filePath = storage_path('app/public/' . $finance->file_path);
            
            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }

            return response()->file($filePath);
        } catch (\Exception $e) {
            Log::error('Error viewing finance file: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error accessing file'
            ], 500);
        }
    }

    /**
     * Download the finance file
     */
    public function downloadFile(Finance $finance): \Symfony\Component\HttpFoundation\BinaryFileResponse|\Illuminate\Http\JsonResponse
    {
        try {
            if (!$finance->file_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'No file associated with this finance record'
                ], 404);
            }

            $filePath = storage_path('app/public/' . $finance->file_path);
            
            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }

            $originalName = basename($finance->file_path);
            
            return response()->download($filePath, $originalName);
        } catch (\Exception $e) {
            Log::error('Error downloading finance file: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error downloading file'
            ], 500);
        }
    }
}