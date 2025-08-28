<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class AISettings extends Model
{
    protected $table = 'ai_settings';
    
    protected $fillable = [
        'deepseek_api_key',
        'deepseek_base_url',
        'model',
        'max_tokens',
        'temperature',
        'is_active'
    ];

    protected $casts = [
        'temperature' => 'decimal:2',
        'max_tokens' => 'integer',
        'is_active' => 'boolean',
    ];

    // Encrypt API key when saving
    public function setDeepseekApiKeyAttribute($value)
    {
        if ($value) {
            $this->attributes['deepseek_api_key'] = Crypt::encryptString($value);
        }
    }

    // Decrypt API key when retrieving
    public function getDeepseekApiKeyAttribute($value)
    {
        if ($value) {
            try {
                return Crypt::decryptString($value);
            } catch (\Exception $e) {
                return null;
            }
        }
        return null;
    }

    // Get the current active settings
    public static function getActive()
    {
        return static::where('is_active', true)->first();
    }

    // Create or update settings (singleton pattern)
    public static function updateSettings(array $data)
    {
        $settings = static::first();
        
        if ($settings) {
            $settings->update($data);
        } else {
            $settings = static::create($data);
        }

        return $settings;
    }

    // Check if API is configured
    public static function isConfigured()
    {
        $settings = static::getActive();
        return $settings && !empty($settings->deepseek_api_key);
    }

    // Get settings for API calls (with decrypted key)
    public function getApiConfig()
    {
        return [
            'api_key' => $this->deepseek_api_key,
            'base_url' => $this->deepseek_base_url,
            'model' => $this->model,
            'max_tokens' => $this->max_tokens,
            'temperature' => $this->temperature,
        ];
    }
}
