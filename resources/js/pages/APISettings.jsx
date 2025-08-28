import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';

const APISettings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [apiSettings, setApiSettings] = useState({
    deepseek_api_key: '',
    deepseek_base_url: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    max_tokens: 2000,
    temperature: 0.7,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUserData();
    loadApiSettings();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin'
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.success) {
          setUser(userData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApiSettings = async () => {
    try {
      const response = await fetch('/api/ai-settings', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setApiSettings(prev => ({...prev, ...data.settings}));
        }
      }
    } catch (error) {
      console.error('Error loading API settings:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setApiSettings(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!apiSettings.deepseek_api_key.trim()) {
      newErrors.deepseek_api_key = 'API Key is required';
    }
    
    if (!apiSettings.deepseek_base_url.trim()) {
      newErrors.deepseek_base_url = 'Base URL is required';
    }
    
    if (!apiSettings.model.trim()) {
      newErrors.model = 'Model is required';
    }
    
    if (!apiSettings.max_tokens || apiSettings.max_tokens < 1 || apiSettings.max_tokens > 8000) {
      newErrors.max_tokens = 'Max tokens must be between 1 and 8000';
    }
    
    if (apiSettings.temperature < 0 || apiSettings.temperature > 2) {
      newErrors.temperature = 'Temperature must be between 0 and 2';
    }

    return newErrors;
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    
    try {
      const response = await fetch('/api/ai-settings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        credentials: 'include',
        body: JSON.stringify(apiSettings)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setConnectionStatus({ type: 'success', message: 'Connection successful! Deepseek API is working properly.' });
      } else {
        setConnectionStatus({ 
          type: 'error', 
          message: data.message || 'Connection failed. Please check your API credentials.' 
        });
      }
    } catch (error) {
      console.error('Test connection error:', error);
      setConnectionStatus({ 
        type: 'error', 
        message: 'Network error. Please check your connection and try again.' 
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setSaving(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      const response = await fetch('/api/ai-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        credentials: 'include',
        body: JSON.stringify(apiSettings)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccessMessage('API settings saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors({ submit: data.message || 'Failed to save settings. Please try again.' });
      }
    } catch (error) {
      console.error('Save settings error:', error);
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user} currentPath="api-settings">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} currentPath="api-settings">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">API Settings</h1>
            <p className="text-gray-600 mt-1">Configure AI API settings for analysis features</p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="ml-3 text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Connection Status */}
        {connectionStatus && (
          <div className={`border rounded-md p-4 ${
            connectionStatus.type === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex">
              {connectionStatus.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <p className={`ml-3 text-sm font-medium ${
                connectionStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {connectionStatus.message}
              </p>
            </div>
          </div>
        )}

        {/* Deepseek API Configuration */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Deepseek AI Configuration</h3>
              <p className="text-sm text-gray-600">Configure your Deepseek API for AI analysis features</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* API Key */}
            <div>
              <Label htmlFor="deepseek_api_key">Deepseek API Key *</Label>
              <div className="mt-1 relative">
                <Input
                  id="deepseek_api_key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiSettings.deepseek_api_key}
                  onChange={(e) => handleInputChange('deepseek_api_key', e.target.value)}
                  placeholder="sk-..."
                  className={errors.deepseek_api_key ? 'border-red-300' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showApiKey ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.deepseek_api_key && (
                <p className="text-red-600 text-sm mt-1">{errors.deepseek_api_key}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Deepseek Platform</a>
              </p>
            </div>

            {/* Base URL */}
            <div>
              <Label htmlFor="deepseek_base_url">Base URL *</Label>
              <Input
                id="deepseek_base_url"
                type="url"
                value={apiSettings.deepseek_base_url}
                onChange={(e) => handleInputChange('deepseek_base_url', e.target.value)}
                className={errors.deepseek_base_url ? 'border-red-300' : ''}
              />
              {errors.deepseek_base_url && (
                <p className="text-red-600 text-sm mt-1">{errors.deepseek_base_url}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Model */}
              <div>
                <Label htmlFor="model">Model *</Label>
                <select
                  id="model"
                  value={apiSettings.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="deepseek-chat">deepseek-chat</option>
                  <option value="deepseek-coder">deepseek-coder</option>
                </select>
                {errors.model && (
                  <p className="text-red-600 text-sm mt-1">{errors.model}</p>
                )}
              </div>

              {/* Max Tokens */}
              <div>
                <Label htmlFor="max_tokens">Max Tokens *</Label>
                <Input
                  id="max_tokens"
                  type="number"
                  min="1"
                  max="8000"
                  value={apiSettings.max_tokens}
                  onChange={(e) => handleInputChange('max_tokens', parseInt(e.target.value))}
                  className={errors.max_tokens ? 'border-red-300' : ''}
                />
                {errors.max_tokens && (
                  <p className="text-red-600 text-sm mt-1">{errors.max_tokens}</p>
                )}
              </div>

              {/* Temperature */}
              <div>
                <Label htmlFor="temperature">Temperature *</Label>
                <Input
                  id="temperature"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={apiSettings.temperature}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                  className={errors.temperature ? 'border-red-300' : ''}
                />
                {errors.temperature && (
                  <p className="text-red-600 text-sm mt-1">{errors.temperature}</p>
                )}
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={testingConnection || !apiSettings.deepseek_api_key}
              >
                {testingConnection ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
              
              <Button
                type="submit"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* API Documentation */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">API Documentation</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>Deepseek API:</strong> This system uses the Deepseek API for AI analysis features. 
              Make sure you have sufficient credits in your Deepseek account.
            </p>
            <div>
              <strong>Useful Links:</strong>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li><a href="https://api-docs.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Deepseek API Documentation</a></li>
                <li><a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Deepseek Platform</a></li>
                <li><a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Manage API Keys</a></li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default APISettings;