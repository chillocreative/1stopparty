<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemberResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'member_no' => $this->member_no,
            'name' => $this->name,
            'ic_no' => $this->ic_no,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'address_2' => $this->address_2,
            'postcode' => $this->postcode,
            'city' => $this->city,
            'state' => $this->state,
            'occupation' => $this->occupation,
            'gender' => $this->gender,
            'race' => $this->race,
            'branch' => $this->branch,
            'date_of_birth' => $this->date_of_birth?->format('Y-m-d'),
            'membership_type' => $this->membership_type,
            'join_date' => $this->join_date?->format('Y-m-d'),
            'is_active' => $this->is_active,
            'remarks' => $this->remarks,
            'original_filename' => $this->original_filename,
            'import_batch_id' => $this->import_batch_id,
            'uploaded_by' => $this->uploaded_by,
            'status' => $this->status,
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at?->toISOString(),
            'approval_notes' => $this->approval_notes,
            'has_duplicates' => $this->has_duplicates,
            'duplicate_info' => $this->duplicate_info,
            'uploader' => $this->whenLoaded('uploader', function () {
                return [
                    'id' => $this->uploader->id,
                    'name' => $this->uploader->name,
                    'email' => $this->uploader->email,
                ];
            }),
            'approver' => $this->whenLoaded('approver', function () {
                return [
                    'id' => $this->approver->id,
                    'name' => $this->approver->name,
                    'email' => $this->approver->email,
                ];
            }),
            // Computed attributes
            'full_address' => $this->full_address,
            'formatted_phone' => $this->formatted_phone,
            'age' => $this->age,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}