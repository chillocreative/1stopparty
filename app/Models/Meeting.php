<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Meeting extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'date',
        'time',
        'minit_mesyuarat_file',
        'penyata_kewangan_file',
        'aktiviti_file',
        'created_by',
        'role_id',
        'category_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    /**
     * Get the minit mesyuarat file URL.
     */
    protected function getMinitMesyuaratFileUrlAttribute(): ?string
    {
        return $this->getFileUrl($this->minit_mesyuarat_file);
    }

    /**
     * Get the penyata kewangan file URL.
     */
    protected function getPenyataKewanganFileUrlAttribute(): ?string
    {
        return $this->getFileUrl($this->penyata_kewangan_file);
    }

    /**
     * Get the aktiviti file URL.
     */
    protected function getAktivitiFileUrlAttribute(): ?string
    {
        return $this->getFileUrl($this->aktiviti_file);
    }

    /**
     * Helper method to get file URL.
     */
    private function getFileUrl(?string $filePath): ?string
    {
        if (!$filePath) {
            return null;
        }

        $path = $filePath;

        // Handle different path formats that might be stored
        if (strpos($path, 'storage/') === 0) {
            // Remove 'storage/' prefix if it exists
            $path = substr($path, 8);
        } elseif (strpos($path, 'public/') === 0) {
            // Remove 'public/' prefix if it exists (from some storage paths)
            $path = substr($path, 7);
        }

        // Ensure path starts with meeting_files/ if it's just a filename
        if (!str_contains($path, '/') || strpos($path, 'meeting_files/') !== 0) {
            // If it's just a filename or doesn't start with meeting_files/, add the prefix
            $path = 'meeting_files/' . basename($path);
        }

        // URL encode the filename part to handle spaces and special characters
        $pathParts = explode('/', $path);
        $fileName = array_pop($pathParts);
        $encodedFileName = rawurlencode($fileName);
        $encodedPath = implode('/', $pathParts) . '/' . $encodedFileName;

        return url('storage/' . $encodedPath);
    }

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'minit_mesyuarat_file_url',
        'penyata_kewangan_file_url',
        'aktiviti_file_url'
    ];

    /**
     * Get the user who created the meeting.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the role associated with the meeting.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Get the category associated with the meeting.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(MeetingCategory::class);
    }
}
