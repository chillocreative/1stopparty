<?php

namespace App\Http\Controllers;

use App\Http\Resources\MemberResource;
use App\Models\Member;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class MemberController extends Controller
{
    /**
     * Display a listing of members.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Member::with(['uploader']);

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('ic_no', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by uploader if provided
        if ($request->has('uploaded_by')) {
            $query->where('uploaded_by', $request->uploaded_by);
        }

        $members = $query->orderBy('name', 'asc')->paginate(15);
        
        return response()->json([
            'success' => true,
            'data' => MemberResource::collection($members->items()),
            'meta' => [
                'current_page' => $members->currentPage(),
                'per_page' => $members->perPage(),
                'total' => $members->total(),
                'last_page' => $members->lastPage(),
            ],
        ]);
    }

    /**
     * Store a newly created member.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'ic_no' => 'required|string|unique:members,ic_no',
            'phone' => 'required|string',
            'email' => 'nullable|email',
            'uploaded_by' => 'required|exists:users,id',
        ]);

        $member = Member::create($validated);
        $member->load(['uploader']);

        return response()->json([
            'success' => true,
            'message' => 'Member created successfully',
            'data' => new MemberResource($member),
        ], 201);
    }

    /**
     * Display the specified member.
     */
    public function show(Member $member): JsonResponse
    {
        $member->load(['uploader']);
        
        return response()->json([
            'success' => true,
            'data' => new MemberResource($member),
        ]);
    }

    /**
     * Update the specified member.
     */
    public function update(Request $request, Member $member): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'ic_no' => ['required', 'string', Rule::unique('members')->ignore($member->id)],
            'phone' => 'required|string',
            'email' => 'nullable|email',
        ]);

        $member->update($validated);
        $member->load(['uploader']);

        return response()->json([
            'success' => true,
            'message' => 'Member updated successfully',
            'data' => new MemberResource($member),
        ]);
    }

    /**
     * Remove the specified member.
     */
    public function destroy(Member $member): JsonResponse
    {
        $member->delete();

        return response()->json([
            'success' => true,
            'message' => 'Member deleted successfully',
        ]);
    }

    /**
     * Import members from CSV/XLS file.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:5120', // 5MB max
            'uploaded_by' => 'required|exists:users,id',
        ]);

        $file = $request->file('file');
        $uploadedBy = $request->uploaded_by;
        
        try {
            $data = $this->parseFile($file);
            $results = $this->processImportData($data, $uploadedBy);

            return response()->json([
                'success' => true,
                'message' => 'Import completed successfully',
                'data' => $results,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Parse CSV or Excel file
     */
    private function parseFile($file): array
    {
        $extension = $file->getClientOriginalExtension();
        $path = $file->store('temp');
        
        try {
            if ($extension === 'csv') {
                return $this->parseCsv(Storage::path($path));
            } else {
                return $this->parseExcel(Storage::path($path));
            }
        } finally {
            Storage::delete($path);
        }
    }

    /**
     * Parse CSV file
     */
    private function parseCsv(string $filePath): array
    {
        $data = [];
        $headers = null;
        
        if (($handle = fopen($filePath, 'r')) !== FALSE) {
            while (($row = fgetcsv($handle, 1000, ',')) !== FALSE) {
                if ($headers === null) {
                    $headers = array_map('trim', $row);
                    continue;
                }
                
                if (count($row) === count($headers)) {
                    $data[] = array_combine($headers, array_map('trim', $row));
                }
            }
            fclose($handle);
        }
        
        return $data;
    }

    /**
     * Parse Excel file (basic implementation - would need PhpSpreadsheet for full support)
     */
    private function parseExcel(string $filePath): array
    {
        // For now, treat as CSV since we don't have PhpSpreadsheet installed
        // In a real implementation, you would use PhpSpreadsheet library
        throw new \Exception('Excel import requires PhpSpreadsheet library. Please install it or convert to CSV format.');
    }

    /**
     * Process and validate import data
     */
    private function processImportData(array $data, int $uploadedBy): array
    {
        $results = [
            'total_rows' => count($data),
            'successful' => 0,
            'failed' => 0,
            'errors' => [],
            'created_members' => [],
        ];

        foreach ($data as $index => $row) {
            $rowNumber = $index + 2; // +2 because arrays start at 0 and we skip header row
            
            try {
                // Map CSV headers to database fields (case-insensitive)
                $memberData = $this->mapRowData($row, $uploadedBy);
                
                // Validate the data
                $validator = Validator::make($memberData, [
                    'name' => 'required|string',
                    'ic_no' => 'required|string|unique:members,ic_no',
                    'phone' => 'required|string',
                    'email' => 'nullable|email',
                    'uploaded_by' => 'required|exists:users,id',
                ]);

                if ($validator->fails()) {
                    $results['failed']++;
                    $results['errors'][] = [
                        'row' => $rowNumber,
                        'errors' => $validator->errors()->all(),
                    ];
                    continue;
                }

                // Create the member
                $member = Member::create($memberData);
                $results['successful']++;
                $results['created_members'][] = $member->name;

            } catch (\Exception $e) {
                $results['failed']++;
                $results['errors'][] = [
                    'row' => $rowNumber,
                    'errors' => [$e->getMessage()],
                ];
            }
        }

        return $results;
    }

    /**
     * Map CSV row data to member fields
     */
    private function mapRowData(array $row, int $uploadedBy): array
    {
        // Define possible header mappings (case-insensitive)
        $fieldMappings = [
            'name' => ['name', 'full name', 'member name', 'nama'],
            'ic_no' => ['ic_no', 'ic', 'nric', 'ic number', 'no ic', 'identity card'],
            'phone' => ['phone', 'phone number', 'mobile', 'telefon', 'no telefon'],
            'email' => ['email', 'email address', 'e-mail', 'emel'],
        ];

        $memberData = ['uploaded_by' => $uploadedBy];
        
        foreach ($fieldMappings as $field => $possibleHeaders) {
            $value = null;
            
            foreach ($possibleHeaders as $header) {
                foreach ($row as $key => $val) {
                    if (strtolower(trim($key)) === strtolower($header)) {
                        $value = trim($val);
                        break 2;
                    }
                }
            }
            
            if ($field === 'email' && empty($value)) {
                $memberData[$field] = null;
            } else {
                $memberData[$field] = $value;
            }
        }

        return $memberData;
    }
}