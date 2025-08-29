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
        'openai_api_key',
        'openai_base_url',
        'openai_model',
        'ai_provider',
        'model',
        'max_tokens',
        'temperature',
        'enable_streaming',
        'is_active'
    ];

    protected $casts = [
        'temperature' => 'decimal:2',
        'max_tokens' => 'integer',
        'is_active' => 'boolean',
        'enable_streaming' => 'boolean',
    ];

    // Encrypt Deepseek API key when saving
    public function setDeepseekApiKeyAttribute($value)
    {
        if ($value) {
            $this->attributes['deepseek_api_key'] = Crypt::encryptString($value);
        }
    }

    // Decrypt Deepseek API key when retrieving
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

    // Encrypt OpenAI API key when saving
    public function setOpenaiApiKeyAttribute($value)
    {
        if ($value) {
            $this->attributes['openai_api_key'] = Crypt::encryptString($value);
        }
    }

    // Decrypt OpenAI API key when retrieving
    public function getOpenaiApiKeyAttribute($value)
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
        if (!$settings) return false;
        
        if ($settings->ai_provider === 'openai') {
            return !empty($settings->openai_api_key);
        } else {
            return !empty($settings->deepseek_api_key);
        }
    }

    // Get settings for API calls (with decrypted key)
    public function getApiConfig()
    {
        if ($this->ai_provider === 'openai') {
            return [
                'api_key' => $this->openai_api_key,
                'base_url' => $this->openai_base_url,
                'model' => $this->openai_model,
                'max_tokens' => (int) $this->max_tokens,
                'temperature' => (float) $this->temperature,
                'enable_streaming' => (bool) $this->enable_streaming,
                'provider' => 'openai'
            ];
        } else {
            return [
                'api_key' => $this->deepseek_api_key,
                'base_url' => $this->deepseek_base_url,
                'model' => $this->model,
                'max_tokens' => (int) $this->max_tokens,
                'temperature' => (float) $this->temperature,
                'enable_streaming' => (bool) $this->enable_streaming,
                'provider' => 'deepseek'
            ];
        }
    }

    // Get available OpenAI models
    public static function getOpenAIModels()
    {
        return [
            'gpt-4o' => 'GPT-4o',
            'gpt-4o-mini' => 'GPT-4o Mini',
            'gpt-4-turbo' => 'GPT-4 Turbo',
            'gpt-4' => 'GPT-4',
            'gpt-3.5-turbo' => 'GPT-3.5 Turbo'
        ];
    }

    // Get available Deepseek models
    public static function getDeepseekModels()
    {
        return [
            'deepseek-chat' => 'Deepseek Chat',
            'deepseek-coder' => 'Deepseek Coder'
        ];
    }
}
