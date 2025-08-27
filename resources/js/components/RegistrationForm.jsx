import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Label from './ui/Label';

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    ic_number: '',
    phone: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // For IC number and phone, only allow digits
    if (name === 'ic_number' || name === 'phone') {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Basic client-side validation
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Full Name is required';
    }
    if (!formData.ic_number.trim()) {
      newErrors.ic_number = 'IC Number is required';
    } else if (!/^\d{12}$/.test(formData.ic_number)) {
      newErrors.ic_number = 'IC Number must be 12 digits only (no symbols)';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Handphone Number is required';
    } else if (!/^01[0-9]{8,9}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10-11 digits starting with 01 (no symbols)';
    }
    // Email is optional but must be valid if provided
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email format is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Password confirmation is required';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      // Get CSRF token
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
      // Make API call to register
      const response = await fetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful - redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        // Registration failed - show errors
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.message || 'Registration failed. Please try again.' });
        }
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          Register for access to the 1 Stop Party System
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {errors.general}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={loading}
              className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ic_number">IC Number</Label>
            <Input
              id="ic_number"
              name="ic_number"
              type="text"
              maxLength="12"
              placeholder="12 digits only (e.g., 990101140123)"
              value={formData.ic_number}
              onChange={handleInputChange}
              disabled={loading}
              className={errors.ic_number ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.ic_number && (
              <p className="text-sm text-red-600">{errors.ic_number}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Handphone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="text"
              maxLength="11"
              placeholder="10-11 digits only (e.g., 0123456789)"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={loading}
              className={errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address (if any)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email (optional)"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
              className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password (min. 8 characters)"
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
              className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password_confirmation">Confirm Password</Label>
            <Input
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              placeholder="Confirm your password"
              value={formData.password_confirmation}
              onChange={handleInputChange}
              disabled={loading}
              className={errors.password_confirmation ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.password_confirmation && (
              <p className="text-sm text-red-600">{errors.password_confirmation}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-muted-foreground text-center">
          Already have an account?{' '}
          <a href="/" className="text-primary hover:underline">
            Sign in here
          </a>
        </div>
        <div className="text-xs text-muted-foreground text-center">
          By creating an account, you agree to our terms of service.
        </div>
      </CardFooter>
    </Card>
  );
};

export default RegistrationForm;