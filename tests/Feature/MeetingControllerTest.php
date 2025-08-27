<?php

namespace Tests\Feature;

use App\Models\Meeting;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class MeetingControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test roles and users
        $this->role = Role::factory()->create();
        $this->user = User::factory()->create(['role_id' => $this->role->id]);
    }

    public function test_can_list_meetings(): void
    {
        // Create some test meetings
        Meeting::factory()->count(3)->create([
            'created_by' => $this->user->id,
            'role_id' => $this->role->id,
        ]);

        $response = $this->getJson('/api/meetings');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         '*' => [
                             'id',
                             'title',
                             'date',
                             'file_path',
                             'created_by',
                             'creator',
                             'role_id',
                             'role',
                             'created_at',
                             'updated_at',
                         ]
                     ],
                     'meta' => [
                         'current_page',
                         'per_page',
                         'total',
                         'last_page',
                     ]
                 ]);
    }

    public function test_can_create_meeting(): void
    {
        $meetingData = [
            'title' => 'Test Meeting',
            'date' => '2024-12-01',
            'file_path' => 'meetings/2024/test_meeting.pdf',
            'created_by' => $this->user->id,
            'role_id' => $this->role->id,
        ];

        $response = $this->postJson('/api/meetings', $meetingData);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         'id',
                         'title',
                         'date',
                         'file_path',
                         'created_by',
                         'creator',
                         'role_id',
                         'role',
                     ]
                 ]);

        $this->assertDatabaseHas('meetings', [
            'title' => 'Test Meeting',
            'date' => '2024-12-01',
            'file_path' => 'meetings/2024/test_meeting.pdf',
            'created_by' => $this->user->id,
            'role_id' => $this->role->id,
        ]);
    }

    public function test_can_show_meeting(): void
    {
        $meeting = Meeting::factory()->create([
            'created_by' => $this->user->id,
            'role_id' => $this->role->id,
        ]);

        $response = $this->getJson("/api/meetings/{$meeting->id}");

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'id',
                         'title',
                         'date',
                         'file_path',
                         'created_by',
                         'creator',
                         'role_id',
                         'role',
                     ]
                 ]);
    }

    public function test_can_update_meeting(): void
    {
        $meeting = Meeting::factory()->create([
            'created_by' => $this->user->id,
            'role_id' => $this->role->id,
        ]);

        $updateData = [
            'title' => 'Updated Meeting Title',
            'date' => '2024-12-15',
            'file_path' => 'meetings/2024/updated_meeting.pdf',
            'role_id' => $this->role->id,
        ];

        $response = $this->putJson("/api/meetings/{$meeting->id}", $updateData);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         'id',
                         'title',
                         'date',
                         'file_path',
                     ]
                 ]);

        $this->assertDatabaseHas('meetings', [
            'id' => $meeting->id,
            'title' => 'Updated Meeting Title',
            'date' => '2024-12-15',
        ]);
    }

    public function test_can_delete_meeting(): void
    {
        $meeting = Meeting::factory()->create([
            'created_by' => $this->user->id,
            'role_id' => $this->role->id,
        ]);

        $response = $this->deleteJson("/api/meetings/{$meeting->id}");

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Meeting deleted successfully',
                 ]);

        $this->assertDatabaseMissing('meetings', [
            'id' => $meeting->id,
        ]);
    }

    public function test_create_meeting_validation(): void
    {
        $response = $this->postJson('/api/meetings', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['title', 'date', 'created_by', 'role_id']);
    }

    public function test_create_meeting_with_invalid_date(): void
    {
        $meetingData = [
            'title' => 'Test Meeting',
            'date' => 'invalid-date',
            'created_by' => $this->user->id,
            'role_id' => $this->role->id,
        ];

        $response = $this->postJson('/api/meetings', $meetingData);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['date']);
    }

    public function test_create_meeting_with_nonexistent_user(): void
    {
        $meetingData = [
            'title' => 'Test Meeting',
            'date' => '2024-12-01',
            'created_by' => 99999, // Non-existent user ID
            'role_id' => $this->role->id,
        ];

        $response = $this->postJson('/api/meetings', $meetingData);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['created_by']);
    }

    public function test_create_meeting_with_nonexistent_role(): void
    {
        $meetingData = [
            'title' => 'Test Meeting',
            'date' => '2024-12-01',
            'created_by' => $this->user->id,
            'role_id' => 99999, // Non-existent role ID
        ];

        $response = $this->postJson('/api/meetings', $meetingData);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['role_id']);
    }
}