<?php

namespace App\Http\Controllers;

use App\Http\Resources\MemberResource;
use App\Models\Member;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
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
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->search($search);
        }

        // Filter by active status
        if ($request->has('active_only') && $request->active_only === 'true') {
            $query->active();
        }

        // Filter by gender
        if ($request->has('gender') && !empty($request->gender)) {
            $query->where('gender', $request->gender);
        }

        // Filter by state
        if ($request->has('state') && !empty($request->state)) {
            $query->where('state', $request->state);
        }

        // Filter by status
        if ($request->has('status') && !empty($request->status)) {
            if ($request->status === 'approved') {
                $query->approved();
            } else if ($request->status === 'pending') {
                $query->pending();
            }
        }

        // Sort by name by default
        $sortBy = $request->get('sort_by', 'name');
        $sortDirection = $request->get('sort_direction', 'asc');
        $query->orderBy($sortBy, $sortDirection);

        $perPage = $request->get('per_page', 15);
        $members = $query->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => MemberResource::collection($members->items()),
            'meta' => [
                'current_page' => $members->currentPage(),
                'per_page' => $members->perPage(),
                'total' => $members->total(),
                'last_page' => $members->lastPage(),
            ],
            'stats' => [
                'total_members' => Member::count(),
                'approved_members' => Member::approved()->count(),
                'pending_members' => Member::pending()->count(),
                'active_members' => Member::active()->approved()->count(),
                'male_members' => Member::approved()->where('gender', 'M')->count(),
                'female_members' => Member::approved()->where('gender', 'F')->count(),
            ]
        ]);
    }

    /**
     * Store a newly created member.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'ic_no' => 'required|string|max:12|unique:members,ic_no',
            'phone' => 'required|string|max:15',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'postcode' => 'nullable|string|max:10',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'occupation' => 'nullable|string|max:100',
            'gender' => 'nullable|in:M,F',
            'date_of_birth' => 'nullable|date',
            'membership_type' => 'nullable|string|max:100',
            'join_date' => 'nullable|date',
            'remarks' => 'nullable|string|max:1000',
        ]);

        $validated['uploaded_by'] = Auth::id();

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
            'name' => 'required|string|max:255',
            'ic_no' => ['required', 'string', 'max:12', Rule::unique('members')->ignore($member->id)],
            'phone' => 'required|string|max:15',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'postcode' => 'nullable|string|max:10',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'occupation' => 'nullable|string|max:100',
            'gender' => 'nullable|in:M,F',
            'date_of_birth' => 'nullable|date',
            'membership_type' => 'nullable|string|max:100',
            'join_date' => 'nullable|date',
            'is_active' => 'boolean',
            'remarks' => 'nullable|string|max:1000',
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
     * Process uploaded file and check for duplicates
     */
    public function processUpload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:10240', // 10MB max
        ]);

        $file = $request->file('file');
        
        try {
            $data = $this->parseFile($file);
            
            if (empty($data)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No valid data found in the uploaded file',
                ], 422);
            }

            // Find duplicates
            $duplicates = Member::findDuplicatesInCollection($data);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_records' => count($data),
                    'duplicates_count' => count($duplicates),
                    'valid_records' => count($data) - count($duplicates),
                    'duplicates' => $duplicates,
                    'sample_data' => array_slice($data, 0, 5), // Show first 5 records as preview
                    'all_data' => $data, // All parsed data for import
                    'filename' => $file->getClientOriginalName(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'File processing failed: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Import members after duplicate resolution
     */
    public function importMembers(Request $request): JsonResponse
    {
        $request->validate([
            'members_data' => 'required|array',
            'filename' => 'required|string',
            'excluded_rows' => 'array', // Rows to exclude from import
        ]);

        $membersData = $request->members_data;
        $excludedRows = $request->excluded_rows ?? [];
        $filename = $request->filename;
        $batchId = time(); // Simple batch ID
        
        $results = [
            'total_processed' => 0,
            'successful' => 0,
            'failed' => 0,
            'errors' => [],
            'created_members' => [],
        ];

        foreach ($membersData as $index => $memberData) {
            $rowNumber = $index + 2; // +2 for header row and 0-based index
            
            // Skip excluded rows
            if (in_array($rowNumber, $excludedRows)) {
                continue;
            }

            $results['total_processed']++;
            
            try {
                // Prepare member data
                $validatedData = $this->prepareMemberData($memberData, $filename, $batchId);
                
                // Create the member
                $member = Member::create($validatedData);
                $results['successful']++;
                $results['created_members'][] = [
                    'id' => $member->id,
                    'name' => $member->name,
                    'ic_no' => $member->ic_no,
                ];

            } catch (\Exception $e) {
                $results['failed']++;
                $results['errors'][] = [
                    'row' => $rowNumber,
                    'name' => $memberData['name'] ?? 'Unknown',
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Import completed',
            'data' => $results,
        ]);
    }

    /**
     * Delete duplicate entries
     */
    public function deleteDuplicates(Request $request): JsonResponse
    {
        $request->validate([
            'member_ids' => 'required|array',
            'member_ids.*' => 'exists:members,id',
        ]);

        $deletedCount = 0;
        $errors = [];

        foreach ($request->member_ids as $memberId) {
            try {
                $member = Member::find($memberId);
                if ($member) {
                    $member->delete();
                    $deletedCount++;
                }
            } catch (\Exception $e) {
                $errors[] = "Failed to delete member ID {$memberId}: " . $e->getMessage();
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Successfully deleted {$deletedCount} members",
            'deleted_count' => $deletedCount,
            'errors' => $errors,
        ]);
    }

    /**
     * Parse uploaded file
     */
    private function parseFile($file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $path = $file->store('temp');
        
        try {
            if ($extension === 'csv') {
                return $this->parseCsv(Storage::path($path));
            } else {
                // For Excel files, we'll try a simple approach first
                return $this->parseExcelSimple(Storage::path($path));
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
            while (($row = fgetcsv($handle, 2000, ',')) !== FALSE) {
                if ($headers === null) {
                    $headers = array_map('trim', $row);
                    continue;
                }
                
                if (count($row) >= 3) { // At least name, IC, phone
                    $rowData = [];
                    for ($i = 0; $i < count($headers) && $i < count($row); $i++) {
                        $rowData[$headers[$i]] = trim($row[$i]);
                    }
                    $data[] = $this->mapRowData($rowData);
                }
            }
            fclose($handle);
        }
        
        return $data;
    }

    /**
     * Simple Excel parser (converts to CSV format)
     */
    private function parseExcelSimple(string $filePath): array
    {
        // This is a very basic Excel parser
        // For production, you should use PhpSpreadsheet library
        
        // Try to read as CSV (sometimes Excel files can be read this way)
        try {
            return $this->parseCsv($filePath);
        } catch (\Exception $e) {
            throw new \Exception('Excel file parsing requires PhpSpreadsheet library. Please save the file as CSV format or install PhpSpreadsheet.');
        }
    }

    /**
     * Map row data to standardized member fields
     */
    private function mapRowData(array $row): array
    {
        $fieldMappings = [
            'name' => ['name', 'nama', 'full name', 'member name', 'full_name'],
            'ic_no' => ['ic_no', 'ic', 'nric', 'ic number', 'kad pengenalan', 'no ic', 'identity card'],
            'phone' => ['phone', 'mobile', 'telefon', 'phone number', 'mobile number', 'no telefon'],
            'email' => ['email', 'email address', 'e-mail', 'emel'],
            'address' => ['address', 'alamat', 'home address', 'alamat 1'],
            'postcode' => ['postcode', 'poskod', 'zip', 'postal code'],
            'city' => ['city', 'bandar', 'town'],
            'state' => ['state', 'negeri'],
            'occupation' => ['occupation', 'pekerjaan', 'job', 'work'],
            'gender' => ['gender', 'jantina', 'sex'],
            'date_of_birth' => ['date_of_birth', 'dob', 'birth_date', 'tarikh lahir'],
            'membership_type' => ['membership_type', 'jenis keahlian', 'member_type'],
            'join_date' => ['join_date', 'tarikh sertai', 'date_joined'],
            'remarks' => ['remarks', 'notes', 'catatan'],
            // New fields for your Excel format
            'member_no' => ['no anggota', 'member no', 'no. anggota', 'membership no'],
            'race' => ['bangsa', 'race', 'ethnicity'],
            'address_2' => ['alamat 2', 'alamat2', 'address 2', 'address2'],
            'branch' => ['ranting', 'branch', 'cawangan'],
        ];

        $memberData = [];
        
        foreach ($fieldMappings as $field => $possibleHeaders) {
            $value = $this->findValueByHeaders($row, $possibleHeaders);
            
            // Clean and format the value
            if (!empty($value)) {
                switch ($field) {
                    case 'ic_no':
                        $value = preg_replace('/\D/', '', $value); // Remove non-digits
                        break;
                    case 'phone':
                        $value = preg_replace('/\D/', '', $value); // Remove non-digits
                        if (strlen($value) === 9 && substr($value, 0, 1) !== '0') {
                            $value = '0' . $value; // Add leading 0 if missing
                        }
                        break;
                    case 'gender':
                        $value = strtoupper(substr($value, 0, 1)); // M or F
                        if (!in_array($value, ['M', 'F'])) {
                            $value = null;
                        }
                        break;
                    case 'date_of_birth':
                    case 'join_date':
                        try {
                            $value = date('Y-m-d', strtotime($value));
                        } catch (\Exception $e) {
                            $value = null;
                        }
                        break;
                    case 'email':
                        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                            $value = null;
                        }
                        break;
                }
            }
            
            $memberData[$field] = $value ?: null;
        }

        // Combine address fields if both address and address_2 exist
        if (!empty($memberData['address']) && !empty($memberData['address_2'])) {
            $memberData['address'] = trim($memberData['address'] . ', ' . $memberData['address_2']);
        }

        return $memberData;
    }

    /**
     * Find value by checking multiple possible headers
     */
    private function findValueByHeaders(array $row, array $possibleHeaders): ?string
    {
        foreach ($possibleHeaders as $header) {
            foreach ($row as $key => $value) {
                if (strtolower(trim($key)) === strtolower($header)) {
                    return trim($value);
                }
            }
        }
        return null;
    }

    /**
     * Prepare member data for database insertion
     */
    private function prepareMemberData(array $memberData, string $filename, int $batchId): array
    {
        return array_merge($memberData, [
            'uploaded_by' => Auth::id(),
            'original_filename' => $filename,
            'import_batch_id' => $batchId,
            'is_active' => true,
            'status' => 'pending', // All imported members start as pending
        ]);
    }

    /**
     * Get pending members for approval
     */
    public function getPendingMembers(Request $request): JsonResponse
    {
        $query = Member::with(['uploader'])
            ->pending()
            ->orderBy('created_at', 'desc');

        $perPage = $request->get('per_page', 15);
        $members = $query->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => MemberResource::collection($members->items()),
            'meta' => [
                'current_page' => $members->currentPage(),
                'per_page' => $members->perPage(),
                'total' => $members->total(),
                'last_page' => $members->lastPage(),
            ],
            'stats' => [
                'total_pending' => Member::pending()->count(),
                'with_duplicates' => Member::pending()->withDuplicates()->count(),
            ]
        ]);
    }

    /**
     * Approve members
     */
    public function approveMembers(Request $request): JsonResponse
    {
        $request->validate([
            'member_ids' => 'required|array',
            'member_ids.*' => 'exists:members,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        $approvedCount = 0;
        $errors = [];

        foreach ($request->member_ids as $memberId) {
            try {
                $member = Member::find($memberId);
                if ($member && $member->status === 'pending') {
                    $member->update([
                        'status' => 'approved',
                        'approved_by' => Auth::id(),
                        'approved_at' => now(),
                        'approval_notes' => $request->notes,
                    ]);
                    $approvedCount++;
                }
            } catch (\Exception $e) {
                $errors[] = "Failed to approve member ID {$memberId}: " . $e->getMessage();
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Successfully approved {$approvedCount} members",
            'approved_count' => $approvedCount,
            'errors' => $errors,
        ]);
    }

    /**
     * Reject members
     */
    public function rejectMembers(Request $request): JsonResponse
    {
        $request->validate([
            'member_ids' => 'required|array',
            'member_ids.*' => 'exists:members,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        $rejectedCount = 0;
        $errors = [];

        foreach ($request->member_ids as $memberId) {
            try {
                $member = Member::find($memberId);
                if ($member && $member->status === 'pending') {
                    $member->update([
                        'status' => 'rejected',
                        'approved_by' => Auth::id(),
                        'approved_at' => now(),
                        'approval_notes' => $request->notes,
                    ]);
                    $rejectedCount++;
                }
            } catch (\Exception $e) {
                $errors[] = "Failed to reject member ID {$memberId}: " . $e->getMessage();
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Successfully rejected {$rejectedCount} members",
            'rejected_count' => $rejectedCount,
            'errors' => $errors,
        ]);
    }

    /**
     * Get member dashboard analytics
     */
    public function getDashboardAnalytics()
    {
        try {
            $now = now();
            $lastMonth = $now->copy()->subMonth();
            
            // Total members statistics
            $totalMembers = Member::count();
            $approvedMembers = Member::where('status', 'approved')->count();
            $pendingMembers = Member::where('status', 'pending')->count();
            $newThisMonth = Member::where('created_at', '>=', $lastMonth)->count();
            
            // Gender distribution
            $genderDistribution = Member::selectRaw('gender, COUNT(*) as count')
                ->whereNotNull('gender')
                ->groupBy('gender')
                ->pluck('count', 'gender')
                ->toArray();
            
            // Race distribution
            $raceDistribution = Member::selectRaw('race, COUNT(*) as count')
                ->whereNotNull('race')
                ->groupBy('race')
                ->orderByDesc('count')
                ->limit(10)
                ->pluck('count', 'race')
                ->toArray();
            
            // Branch distribution
            $branchDistribution = Member::selectRaw('branch, COUNT(*) as count')
                ->whereNotNull('branch')
                ->groupBy('branch')
                ->orderByDesc('count')
                ->limit(10)
                ->pluck('count', 'branch')
                ->toArray();
            
            // Age groups (calculated from IC numbers)
            $ageGroups = [
                '18-25' => 0,
                '26-35' => 0,
                '36-45' => 0,
                '46-55' => 0,
                '56-65' => 0,
                '65+' => 0,
                'Unknown' => 0
            ];
            
            $members = Member::whereNotNull('ic_no')->get(['ic_no']);
            foreach ($members as $member) {
                $age = $this->calculateAgeFromIC($member->ic_no);
                if ($age === null) {
                    $ageGroups['Unknown']++;
                } elseif ($age < 26) {
                    $ageGroups['18-25']++;
                } elseif ($age < 36) {
                    $ageGroups['26-35']++;
                } elseif ($age < 46) {
                    $ageGroups['36-45']++;
                } elseif ($age < 56) {
                    $ageGroups['46-55']++;
                } elseif ($age < 66) {
                    $ageGroups['56-65']++;
                } else {
                    $ageGroups['65+']++;
                }
            }
            
            // Monthly registration trends (last 6 months)
            $monthlyTrends = [];
            for ($i = 5; $i >= 0; $i--) {
                $date = $now->copy()->subMonths($i);
                $monthName = $date->format('M Y');
                $count = Member::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count();
                $monthlyTrends[$monthName] = $count;
            }
            
            // State distribution
            $stateDistribution = Member::selectRaw('state, COUNT(*) as count')
                ->whereNotNull('state')
                ->groupBy('state')
                ->orderByDesc('count')
                ->limit(10)
                ->pluck('count', 'state')
                ->toArray();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_members' => $totalMembers,
                    'approved_members' => $approvedMembers,
                    'pending_members' => $pendingMembers,
                    'new_this_month' => $newThisMonth,
                    'gender_distribution' => $genderDistribution,
                    'race_distribution' => $raceDistribution,
                    'branch_distribution' => $branchDistribution,
                    'age_groups' => $ageGroups,
                    'monthly_trends' => $monthlyTrends,
                    'state_distribution' => $stateDistribution,
                    'membership_types' => Member::selectRaw('membership_type, COUNT(*) as count')
                        ->whereNotNull('membership_type')
                        ->groupBy('membership_type')
                        ->pluck('count', 'membership_type')
                        ->toArray()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard analytics: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Calculate age from Malaysian IC number
     */
    private function calculateAgeFromIC($icNumber)
    {
        if (strlen($icNumber) !== 12) {
            return null;
        }
        
        $year = substr($icNumber, 0, 2);
        $month = substr($icNumber, 2, 2);
        $day = substr($icNumber, 4, 2);
        
        // Determine century
        $currentYear = date('Y');
        $century = $year <= (($currentYear - 2000) + 10) ? '20' : '19';
        $fullYear = $century . $year;
        
        try {
            $birthDate = new \DateTime("$fullYear-$month-$day");
            $today = new \DateTime();
            $age = $today->diff($birthDate)->y;
            return $age;
        } catch (\Exception $e) {
            return null;
        }
    }
}