<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Member extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'ic_no',
        'phone',
        'email',
        'address',
        'address_2',
        'postcode',
        'city',
        'state',
        'occupation',
        'gender',
        'date_of_birth',
        'membership_type',
        'join_date',
        'is_active',
        'remarks',
        'uploaded_by',
        'original_filename',
        'import_batch_id',
        'status',
        'approved_by',
        'approved_at',
        'approval_notes',
        'has_duplicates',
        'duplicate_info',
        'member_no',
        'race',
        'branch',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date_of_birth' => 'date',
        'join_date' => 'date',
        'is_active' => 'boolean',
        'approved_at' => 'datetime',
        'has_duplicates' => 'boolean',
        'duplicate_info' => 'array',
    ];

    /**
     * Get the user who uploaded the member.
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Get the user who approved the member.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Check for duplicate members by name, IC number, or phone
     */
    public static function findDuplicates(array $memberData)
    {
        return self::where(function ($query) use ($memberData) {
            $query->where('name', 'LIKE', '%' . trim($memberData['name']) . '%')
                  ->orWhere('ic_no', $memberData['ic_no'])
                  ->orWhere('phone', $memberData['phone']);
        })->get();
    }

    /**
     * Find duplicates in a collection of member data
     */
    public static function findDuplicatesInCollection(array $membersData)
    {
        $duplicates = [];
        
        foreach ($membersData as $index => $memberData) {
            // Check against existing database records
            $dbDuplicates = self::findDuplicates($memberData);
            
            // Check against other records in the same import
            $importDuplicates = [];
            foreach ($membersData as $compareIndex => $compareData) {
                if ($index !== $compareIndex) {
                    if (
                        (strtolower(trim($memberData['name'])) === strtolower(trim($compareData['name']))) ||
                        ($memberData['ic_no'] === $compareData['ic_no']) ||
                        ($memberData['phone'] === $compareData['phone'])
                    ) {
                        $importDuplicates[] = [
                            'row' => $compareIndex + 2, // +2 for header row and 0-based index
                            'data' => $compareData,
                            'duplicate_type' => 'import'
                        ];
                    }
                }
            }
            
            if ($dbDuplicates->count() > 0 || !empty($importDuplicates)) {
                $duplicates[] = [
                    'row' => $index + 2, // +2 for header row and 0-based index
                    'data' => $memberData,
                    'database_duplicates' => $dbDuplicates->toArray(),
                    'import_duplicates' => $importDuplicates
                ];
            }
        }
        
        return $duplicates;
    }

    /**
     * Get formatted address
     */
    public function getFullAddressAttribute()
    {
        $parts = array_filter([
            $this->address,
            $this->postcode,
            $this->city,
            $this->state
        ]);
        
        return implode(', ', $parts);
    }

    /**
     * Get formatted phone number
     */
    public function getFormattedPhoneAttribute()
    {
        $phone = preg_replace('/\D/', '', $this->phone);
        
        if (strlen($phone) === 10 && substr($phone, 0, 1) === '0') {
            return substr($phone, 0, 3) . '-' . substr($phone, 3, 3) . substr($phone, 6);
        }
        
        return $this->phone;
    }

    /**
     * Get age from date of birth
     */
    public function getAgeAttribute()
    {
        if (!$this->date_of_birth) {
            return null;
        }
        
        return Carbon::parse($this->date_of_birth)->age;
    }

    /**
     * Scope for active members
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for searching members
     */
    public function scopeSearch($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'LIKE', "%{$term}%")
              ->orWhere('ic_no', 'LIKE', "%{$term}%")
              ->orWhere('phone', 'LIKE', "%{$term}%")
              ->orWhere('email', 'LIKE', "%{$term}%")
              ->orWhere('city', 'LIKE', "%{$term}%")
              ->orWhere('state', 'LIKE', "%{$term}%");
        });
    }

    /**
     * Scope for pending members
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for approved members
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope for members with duplicates
     */
    public function scopeWithDuplicates($query)
    {
        return $query->where('has_duplicates', true);
    }
}